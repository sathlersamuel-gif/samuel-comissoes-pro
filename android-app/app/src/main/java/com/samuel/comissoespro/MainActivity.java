package com.samuel.comissoespro;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;
import android.print.PageRange;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintDocumentInfo;
import android.print.PrintManager;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.core.content.FileProvider;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    private static final String APP_URL = "https://sathlersamuel-gif.github.io/samuel-comissoes-pro/";
    private static final int FILE_CHOOSER_REQUEST = 1001;

    private WebView webView;
    private ProgressBar progressBar;
    private TextView errorView;
    private ValueCallback<Uri[]> fileChooserCallback;

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(6, 19, 38));

        webView = new WebView(this);
        progressBar = new ProgressBar(this);
        errorView = new TextView(this);

        errorView.setTextColor(Color.WHITE);
        errorView.setTextSize(17);
        errorView.setGravity(android.view.Gravity.CENTER);
        errorView.setPadding(40, 40, 40, 40);
        errorView.setText("Não foi possível conectar.\nVerifique sua internet e toque aqui para tentar novamente.");
        errorView.setVisibility(View.GONE);
        errorView.setOnClickListener(v -> carregarApp());

        FrameLayout.LayoutParams webParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
        );
        FrameLayout.LayoutParams progressParams = new FrameLayout.LayoutParams(80, 80);
        progressParams.gravity = android.view.Gravity.CENTER;
        FrameLayout.LayoutParams errorParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
        );

        root.addView(webView, webParams);
        root.addView(progressBar, progressParams);
        root.addView(errorView, errorParams);
        setContentView(root);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        settings.setUserAgentString(settings.getUserAgentString() + " SamuelComissoesPRO-Android/3.4");

        webView.addJavascriptInterface(new PdfBridge(), "AndroidPdf");

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(
                    WebView webView,
                    ValueCallback<Uri[]> filePathCallback,
                    FileChooserParams fileChooserParams
            ) {
                if (fileChooserCallback != null) fileChooserCallback.onReceiveValue(null);
                fileChooserCallback = filePathCallback;

                Intent intent = new Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
                intent.setType("image/*");
                try {
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST);
                    return true;
                } catch (Exception e) {
                    fileChooserCallback = null;
                    return false;
                }
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String host = uri.getHost();
                if (host != null && (host.equals("sathlersamuel-gif.github.io") || host.endsWith("firebaseapp.com") || host.endsWith("googleapis.com"))) {
                    return false;
                }
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                } catch (Exception ignored) {
                }
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                progressBar.setVisibility(View.GONE);
                errorView.setVisibility(View.GONE);
                webView.setVisibility(View.VISIBLE);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    progressBar.setVisibility(View.GONE);
                    webView.setVisibility(View.GONE);
                    errorView.setVisibility(View.VISIBLE);
                }
            }
        });

        webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) -> {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
            } catch (Exception ignored) {
            }
        });

        carregarApp();
    }

    private File salvarArquivo(byte[] dados, String nomeArquivo, String nomePadrao, String extensao) throws Exception {
        String nomeSeguro = (nomeArquivo == null || nomeArquivo.trim().isEmpty())
                ? nomePadrao
                : nomeArquivo.replaceAll("[^a-zA-Z0-9._-]", "_");
        if (!nomeSeguro.toLowerCase().endsWith(extensao)) nomeSeguro += extensao;

        File arquivo = new File(getCacheDir(), nomeSeguro);
        try (FileOutputStream saida = new FileOutputStream(arquivo)) {
            saida.write(dados);
        }
        return arquivo;
    }

    private void compartilharArquivo(File arquivo, String tipoMime, String titulo, String texto) {
        Uri uri = FileProvider.getUriForFile(
                MainActivity.this,
                getPackageName() + ".fileprovider",
                arquivo
        );

        Intent compartilhar = new Intent(Intent.ACTION_SEND);
        compartilhar.setType(tipoMime);
        compartilhar.putExtra(Intent.EXTRA_STREAM, uri);
        compartilhar.putExtra(Intent.EXTRA_SUBJECT, titulo);
        compartilhar.putExtra(Intent.EXTRA_TEXT, texto);
        compartilhar.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

        startActivity(Intent.createChooser(compartilhar, titulo));
    }

    private class PdfBridge {
        @JavascriptInterface
        public void compartilharPdf(String base64Pdf, String nomeArquivo) {
            runOnUiThread(() -> {
                try {
                    String limpo = base64Pdf;
                    int virgula = limpo.indexOf(',');
                    if (virgula >= 0) limpo = limpo.substring(virgula + 1);

                    File arquivo = salvarArquivo(
                            Base64.decode(limpo, Base64.DEFAULT),
                            nomeArquivo,
                            "Relatorio-Controle-de-Vendas.pdf",
                            ".pdf"
                    );
                    compartilharArquivo(
                            arquivo,
                            "application/pdf",
                            "Compartilhar relatório em PDF",
                            "Relatório em PDF do Controle de Vendas PRO"
                    );
                } catch (Exception e) {
                    webView.evaluateJavascript("alert('Não foi possível compartilhar o PDF. Tente novamente.');", null);
                }
            });
        }

        @JavascriptInterface
        public void compartilharBackup(String conteudo, String nomeArquivo) {
            runOnUiThread(() -> {
                try {
                    File arquivo = salvarArquivo(
                            conteudo.getBytes(StandardCharsets.UTF_8),
                            nomeArquivo,
                            "backup_controle_vendas.json",
                            ".json"
                    );
                    compartilharArquivo(
                            arquivo,
                            "application/json",
                            "Exportar backup",
                            "Backup do Controle de Vendas PRO"
                    );
                } catch (Exception e) {
                    webView.evaluateJavascript("alert('Não foi possível exportar o backup. Tente novamente.');", null);
                }
            });
        }

        @JavascriptInterface
        public void imprimirPdf(String base64Pdf, String nomeArquivo) {
            runOnUiThread(() -> {
                try {
                    String limpo = base64Pdf;
                    int virgula = limpo.indexOf(',');
                    if (virgula >= 0) limpo = limpo.substring(virgula + 1);

                    File arquivo = salvarArquivo(
                            Base64.decode(limpo, Base64.DEFAULT),
                            nomeArquivo,
                            "Relatorio-Controle-de-Vendas.pdf",
                            ".pdf"
                    );
                    String nomeSeguro = arquivo.getName();

                    PrintManager printManager = (PrintManager) getSystemService(PRINT_SERVICE);
                    PrintAttributes atributos = new PrintAttributes.Builder()
                            .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                            .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                            .build();
                    printManager.print(nomeSeguro, new PdfFilePrintAdapter(arquivo, nomeSeguro), atributos);
                } catch (Exception e) {
                    webView.evaluateJavascript("alert('Não foi possível abrir o relatório para impressão. Tente novamente.');", null);
                }
            });
        }
    }

    private static class PdfFilePrintAdapter extends PrintDocumentAdapter {
        private final File arquivo;
        private final String nome;

        PdfFilePrintAdapter(File arquivo, String nome) {
            this.arquivo = arquivo;
            this.nome = nome;
        }

        @Override
        public void onLayout(PrintAttributes oldAttributes, PrintAttributes newAttributes,
                             CancellationSignal cancellationSignal, LayoutResultCallback callback,
                             Bundle extras) {
            if (cancellationSignal.isCanceled()) {
                callback.onLayoutCancelled();
                return;
            }
            PrintDocumentInfo info = new PrintDocumentInfo.Builder(nome)
                    .setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT)
                    .setPageCount(PrintDocumentInfo.PAGE_COUNT_UNKNOWN)
                    .build();
            callback.onLayoutFinished(info, true);
        }

        @Override
        public void onWrite(PageRange[] pages, ParcelFileDescriptor destination,
                            CancellationSignal cancellationSignal, WriteResultCallback callback) {
            try (FileInputStream entrada = new FileInputStream(arquivo);
                 FileOutputStream saida = new FileOutputStream(destination.getFileDescriptor())) {
                byte[] buffer = new byte[8192];
                int lidos;
                while ((lidos = entrada.read(buffer)) != -1) {
                    if (cancellationSignal.isCanceled()) {
                        callback.onWriteCancelled();
                        return;
                    }
                    saida.write(buffer, 0, lidos);
                }
                callback.onWriteFinished(new PageRange[]{PageRange.ALL_PAGES});
            } catch (Exception e) {
                callback.onWriteFailed(e.getMessage());
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != FILE_CHOOSER_REQUEST || fileChooserCallback == null) return;

        Uri[] resultado = null;
        if (resultCode == RESULT_OK && data != null && data.getData() != null) {
            resultado = new Uri[]{data.getData()};
        }
        fileChooserCallback.onReceiveValue(resultado);
        fileChooserCallback = null;
    }

    private void carregarApp() {
        errorView.setVisibility(View.GONE);
        webView.setVisibility(View.VISIBLE);
        progressBar.setVisibility(View.VISIBLE);
        webView.loadUrl(APP_URL);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (fileChooserCallback != null) {
            fileChooserCallback.onReceiveValue(null);
            fileChooserCallback = null;
        }
        if (webView != null) webView.destroy();
        super.onDestroy();
    }
}
