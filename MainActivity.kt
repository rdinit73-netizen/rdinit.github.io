package com.exlibris.readingjournal

import android.annotation.SuppressLint
import android.content.ClipData
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.util.Base64
import android.view.View
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.core.content.FileProvider
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updateLayoutParams
import androidx.core.view.updatePadding
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdListener
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback
import com.exlibris.readingjournal.databinding.ActivityMainBinding
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var sharedPreferences: SharedPreferences

    private var interstitialAd: InterstitialAd? = null
    private var rewardedAd: RewardedAd? = null
    private var isInterstitialLoading = false
    private var isRewardedLoading = false

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Enable edge-to-edge layout with full insets management
        WindowCompat.setDecorFitsSystemWindows(window, false)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        sharedPreferences = getSharedPreferences("exlibris_native_prefs", Context.MODE_PRIVATE)

        // Setup Window Insets: CRUCIAL to protect smartphone navigation bar / gesture buttons
        setupWindowInsets()

        // Setup Standalone WebView with full DOM Storage & Persistence
        setupWebView()

        // Setup Google AdMob Banner with Official Test Ad Unit
        setupAdMobBanner()

        // Setup Android Native Back Navigation
        setupBackNavigation()
    }

    /**
     * Dynamically adjusts insets to ensure status bar, camera notches,
     * and smartphone navigation buttons (Back, Home, Recents, and Gesture Pill)
     * are NEVER covered by the AdMob banner or the web content.
     */
    private fun setupWindowInsets() {
        ViewCompat.setOnApplyWindowInsetsListener(binding.rootLayout) { _, windowInsets ->
            val statusBars = windowInsets.getInsets(WindowInsetsCompat.Type.statusBars())
            val navBars = windowInsets.getInsets(WindowInsetsCompat.Type.navigationBars())
            val cutouts = windowInsets.getInsets(WindowInsetsCompat.Type.displayCutout())

            // Shift WebView down by the status bar / camera notch height so headers never overlap the clock/battery
            val topInset = maxOf(statusBars.top, cutouts.top)
            binding.webView.updateLayoutParams<ConstraintLayout.LayoutParams> {
                topMargin = topInset
            }

            // Bottom padding for AdMob Container: guarantees banner sits strictly ABOVE
            // the Android function keys (Back, Home, Recent Apps) or gesture pill
            val bottomInset = maxOf(navBars.bottom, cutouts.bottom)
            binding.adContainer.updatePadding(bottom = bottomInset)

            windowInsets
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        binding.webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true // Essential for LocalStorage persistence
            databaseEnabled = true   // Essential for IndexedDB persistence
            allowFileAccess = true
            allowContentAccess = true
            allowFileAccessFromFileURLs = true // Allow loading local assets & images
            allowUniversalAccessFromFileURLs = true // Allow cross-origin requests from local files
            cacheMode = WebSettings.LOAD_DEFAULT
            useWideViewPort = true
            loadWithOverviewMode = true
            displayZoomControls = false
            builtInZoomControls = false
        }

        // Add native bridge to guarantee data persistence & PDF generation
        binding.webView.addJavascriptInterface(AndroidNativeBridge(this, sharedPreferences), "AndroidNative")

        // Catch any direct data URI or blob download triggers
        binding.webView.setDownloadListener { url, _, _, _, _ ->
            if (url != null && url.startsWith("data:application/pdf")) {
                exportAndOpenPdf(url, "ExLibris_Documento.pdf", "ExLibris PDF")
            }
        }

        binding.webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                // Set native flag as early as possible so web app hides simulated banner
                view?.evaluateJavascript("window.__IS_ANDROID_NATIVE__ = true; document.documentElement.classList.add('android-native');", null)
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // Inform web application it is running in Android native container
                view?.evaluateJavascript("window.__IS_ANDROID_NATIVE__ = true; document.documentElement.classList.add('android-native');", null)
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
            }
        }

        binding.webView.webChromeClient = WebChromeClient()

        // Load bundled standalone offline web application with explicit platform param
        val localAssetUrl = "file:///android_asset/www/index.html?platform=android_native"
        binding.webView.loadUrl(localAssetUrl)
    }

    /**
     * Initializes Google AdMob SDK and loads test banner, interstitial and rewarded ads
     */
    private fun setupAdMobBanner() {
        // Initialize Mobile Ads SDK in a background thread
        MobileAds.initialize(this) {
            loadInterstitialAd()
            loadRewardedAd()
        }

        val adRequest = AdRequest.Builder().build()
        binding.adView.loadAd(adRequest)

        binding.adView.adListener = object : AdListener() {
            override fun onAdLoaded() {
                binding.adContainer.visibility = View.VISIBLE
            }

            override fun onAdFailedToLoad(adError: LoadAdError) {
                // Keep container visible with fallback background
            }
        }
    }

    fun loadInterstitialAd() {
        if (isInterstitialLoading || interstitialAd != null) return
        isInterstitialLoading = true
        val adRequest = AdRequest.Builder().build()
        InterstitialAd.load(
            this,
            getString(R.string.admob_test_interstitial_id),
            adRequest,
            object : InterstitialAdLoadCallback() {
                override fun onAdLoaded(ad: InterstitialAd) {
                    interstitialAd = ad
                    isInterstitialLoading = false
                    ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                        override fun onAdDismissedFullScreenContent() {
                            interstitialAd = null
                            loadInterstitialAd()
                            runOnUiThread {
                                binding.webView.evaluateJavascript("window.onAndroidInterstitialClosed && window.onAndroidInterstitialClosed();", null)
                            }
                        }

                        override fun onAdFailedToShowFullScreenContent(adError: AdError) {
                            interstitialAd = null
                            loadInterstitialAd()
                            runOnUiThread {
                                binding.webView.evaluateJavascript("window.onAndroidInterstitialClosed && window.onAndroidInterstitialClosed();", null)
                            }
                        }
                    }
                }

                override fun onAdFailedToLoad(loadAdError: LoadAdError) {
                    interstitialAd = null
                    isInterstitialLoading = false
                }
            }
        )
    }

    fun showInterstitialAd() {
        runOnUiThread {
            if (interstitialAd != null) {
                interstitialAd?.show(this)
            } else {
                loadInterstitialAd()
                binding.webView.evaluateJavascript("window.onAndroidInterstitialClosed && window.onAndroidInterstitialClosed();", null)
            }
        }
    }

    fun loadRewardedAd() {
        if (isRewardedLoading || rewardedAd != null) return
        isRewardedLoading = true
        val adRequest = AdRequest.Builder().build()
        RewardedAd.load(
            this,
            getString(R.string.admob_test_rewarded_id),
            adRequest,
            object : RewardedAdLoadCallback() {
                override fun onAdLoaded(ad: RewardedAd) {
                    rewardedAd = ad
                    isRewardedLoading = false
                    ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                        override fun onAdDismissedFullScreenContent() {
                            rewardedAd = null
                            loadRewardedAd()
                            runOnUiThread {
                                binding.webView.evaluateJavascript("window.onAndroidRewardedClosed && window.onAndroidRewardedClosed();", null)
                            }
                        }

                        override fun onAdFailedToShowFullScreenContent(adError: AdError) {
                            rewardedAd = null
                            loadRewardedAd()
                            runOnUiThread {
                                binding.webView.evaluateJavascript("window.onAndroidRewardedEarned && window.onAndroidRewardedEarned();", null)
                            }
                        }
                    }
                }

                override fun onAdFailedToLoad(loadAdError: LoadAdError) {
                    rewardedAd = null
                    isRewardedLoading = false
                }
            }
        )
    }

    fun showRewardedAd() {
        runOnUiThread {
            if (rewardedAd != null) {
                rewardedAd?.show(this) { _ ->
                    runOnUiThread {
                        binding.webView.evaluateJavascript("window.onAndroidRewardedEarned && window.onAndroidRewardedEarned();", null)
                    }
                }
            } else {
                loadRewardedAd()
                // Graceful fallback if ad still loading so user can proceed
                binding.webView.evaluateJavascript("window.onAndroidRewardedEarned && window.onAndroidRewardedEarned();", null)
            }
        }
    }

    /**
     * Saves base64-encoded PDF to internal cache and Documents directory,
     * then opens the system viewer via ACTION_VIEW or share chooser.
     */
    fun exportAndOpenPdf(base64Data: String, fileName: String, title: String? = null) {
        val safeTitle = title ?: "Scheda Libro ExLibris"
        val safeName = if (fileName.endsWith(".pdf", ignoreCase = true)) fileName else "$fileName.pdf"

        try {
            val cleanBase64 = if (base64Data.contains(",")) {
                base64Data.substringAfter(",")
            } else {
                base64Data
            }.trim().replace("\n", "").replace("\r", "")

            val pdfBytes = Base64.decode(cleanBase64, Base64.DEFAULT)

            // Save to app cache dir for FileProvider
            val pdfFile = File(cacheDir, safeName)
            FileOutputStream(pdfFile).use { it.write(pdfBytes) }

            // Also save a copy to Documents directory so it persists in storage
            try {
                val docsDir = getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS)
                if (docsDir != null) {
                    if (!docsDir.exists()) docsDir.mkdirs()
                    val extFile = File(docsDir, safeName)
                    FileOutputStream(extFile).use { it.write(pdfBytes) }
                }
            } catch (ignored: Exception) {
                // Secondary copy is optional
            }

            val authority = "${applicationContext.packageName}.fileprovider"
            val uri = FileProvider.getUriForFile(this, authority, pdfFile)

            // Directly open the PDF file in the system PDF viewer (Drive, Acrobat, etc.)
            val viewIntent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, "application/pdf")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                addFlags(Intent.FLAG_ACTIVITY_NO_HISTORY)
                clipData = ClipData.newRawUri("PDF", uri)
            }

            try {
                startActivity(viewIntent)
                Toast.makeText(this, "Apertura PDF in corso...", Toast.LENGTH_SHORT).show()
                return
            } catch (directErr: Exception) {
                // If direct opening fails, fallback to standard PDF chooser
                try {
                    val chooser = Intent.createChooser(viewIntent, safeTitle).apply {
                        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        clipData = ClipData.newRawUri("PDF", uri)
                    }
                    startActivity(chooser)
                    return
                } catch (chooserErr: Exception) {
                    Toast.makeText(this, "Nessun lettore PDF disponibile", Toast.LENGTH_LONG).show()
                }
            }
        } catch (e: Exception) {
            // Robust fallback: Always attempt share sheet if ACTION_VIEW throws
            try {
                val cleanBase64 = if (base64Data.contains(",")) {
                    base64Data.substringAfter(",")
                } else {
                    base64Data
                }.trim().replace("\n", "").replace("\r", "")
                val pdfBytes = Base64.decode(cleanBase64, Base64.DEFAULT)
                val pdfFile = File(cacheDir, safeName)
                FileOutputStream(pdfFile).use { it.write(pdfBytes) }
                val authority = "${applicationContext.packageName}.fileprovider"
                val uri = FileProvider.getUriForFile(this, authority, pdfFile)
                launchShareIntent(uri, safeTitle, safeName)
            } catch (e2: Exception) {
                Toast.makeText(this, "Errore salvataggio PDF: ${e2.message}", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun launchShareIntent(uri: Uri, chooserTitle: String, safeName: String) {
        val shareIntent = Intent(Intent.ACTION_SEND).apply {
            type = "application/pdf"
            putExtra(Intent.EXTRA_STREAM, uri)
            putExtra(Intent.EXTRA_SUBJECT, chooserTitle)
            putExtra(Intent.EXTRA_TEXT, "Scheda PDF esportata con ExLibris: $safeName")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            clipData = ClipData.newRawUri("PDF", uri)
        }

        val shareMatches = packageManager.queryIntentActivities(shareIntent, PackageManager.MATCH_DEFAULT_ONLY)
        for (resolveInfo in shareMatches) {
            grantUriPermission(resolveInfo.activityInfo.packageName, uri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }

        val shareChooser = Intent.createChooser(shareIntent, "Condividi o Salva PDF: $safeName").apply {
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            clipData = ClipData.newRawUri("PDF", uri)
        }
        startActivity(shareChooser)
        Toast.makeText(this, "Condivisione PDF...", Toast.LENGTH_SHORT).show()
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (binding.webView.canGoBack()) {
                    binding.webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }

    override fun onResume() {
        super.onResume()
        binding.adView.resume()
    }

    override fun onPause() {
        binding.adView.pause()
        super.onPause()
    }

    override fun onDestroy() {
        binding.adView.destroy()
        super.onDestroy()
    }

    /**
     * JavaScript Interface Bridge exposed to Web app as window.AndroidNative
     * Gives triple redundancy for data saving in Android SharedPreferences and PDF export
     */
    class AndroidNativeBridge(
        private val context: Context,
        private val preferences: SharedPreferences
    ) {
        @JavascriptInterface
        fun saveData(key: String, value: String) {
            preferences.edit().putString(key, value).apply()
        }

        @JavascriptInterface
        fun getData(key: String): String? {
            return preferences.getString(key, null)
        }

        @JavascriptInterface
        fun showToast(message: String) {
            (context as? MainActivity)?.runOnUiThread {
                Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
            }
        }

        @JavascriptInterface
        fun isNativeAndroid(): Boolean {
            return true
        }

        @JavascriptInterface
        fun saveAndOpenPdf(base64Data: String, fileName: String, title: String) {
            (context as? MainActivity)?.runOnUiThread {
                (context as? MainActivity)?.exportAndOpenPdf(base64Data, fileName, title)
            }
        }

        @JavascriptInterface
        fun saveAndOpenPdf(base64Data: String, fileName: String) {
            saveAndOpenPdf(base64Data, fileName, "Scheda Libro ExLibris")
        }

        @JavascriptInterface
        fun saveAndOpenPdf(base64Data: String) {
            saveAndOpenPdf(base64Data, "ExLibris_Documento.pdf", "Scheda Libro ExLibris")
        }

        @JavascriptInterface
        fun fetchImageBase64(imageUrl: String): String? {
            return try {
                var currentUrl = imageUrl
                var redirects = 0
                while (redirects < 6) {
                    val url = URL(currentUrl)
                    val connection = url.openConnection() as HttpURLConnection
                    connection.instanceFollowRedirects = true
                    connection.connectTimeout = 8000
                    connection.readTimeout = 8000
                    connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    connection.setRequestProperty("Accept", "image/*,*/*;q=0.8")
                    val code = connection.responseCode
                    if (code in 300..399) {
                        val location = connection.getHeaderField("Location") ?: break
                        currentUrl = if (location.startsWith("http://") || location.startsWith("https://")) {
                            location
                        } else {
                            URL(url, location).toString()
                        }
                        connection.disconnect()
                        redirects++
                        continue
                    }
                    if (code in 200..299) {
                        val bytes = connection.inputStream.use { it.readBytes() }
                        val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                        if (bitmap != null) {
                            val stream = ByteArrayOutputStream()
                            bitmap.compress(Bitmap.CompressFormat.JPEG, 90, stream)
                            val jpegBytes = stream.toByteArray()
                            return "data:image/jpeg;base64," + Base64.encodeToString(jpegBytes, Base64.NO_WRAP)
                        } else {
                            val mime = connection.contentType ?: "image/jpeg"
                            val cleanMime = if (mime.contains(";")) mime.substringBefore(";").trim() else mime.trim()
                            val validMime = if (cleanMime.startsWith("image/")) cleanMime else "image/jpeg"
                            return "data:$validMime;base64," + Base64.encodeToString(bytes, Base64.NO_WRAP)
                        }
                    }
                    break
                }
                null
            } catch (e: Exception) {
                null
            }
        }

        @JavascriptInterface
        fun showRewardedAd() {
            (context as? MainActivity)?.showRewardedAd()
        }

        @JavascriptInterface
        fun showInterstitialAd() {
            (context as? MainActivity)?.showInterstitialAd()
        }
    }
}
