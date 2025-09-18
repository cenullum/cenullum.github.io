# Blog Sistemi

Bu klasör blog yazılarınızı organize etmek için kullanılır.

## Klasör Yapısı

```
blogs/
├── blog-template.html          # Blog yazısı şablonu
├── hello_world/               # Örnek blog yazısı
│   ├── index.html
│   └── a.webp
└── README.md                  # Bu dosya
```

## Yeni Blog Yazısı Ekleme

1. **Klasör Oluştur**: Yeni blog yazısı için bir klasör oluşturun
   - Klasör adı: `blog_yazisi_adi` (küçük harf, alt çizgi ile)
   - Örnek: `pixel_art_rehberi`, `oyun_gelistirme_ipuclari`

2. **Template Kullan**: `blog-template.html` dosyasını kopyalayın ve yeni klasörde `index.html` olarak kaydedin

3. **Placeholder'ları Değiştirin**:
   - `BLOG_TITLE`: Blog yazısının başlığı
   - `BLOG_DESCRIPTION`: Blog yazısının açıklaması
   - `BLOG_KEYWORDS`: Anahtar kelimeler (virgülle ayrılmış)
   - `BLOG_URL`: Blog yazısının tam URL'si
   - `BLOG_DATE`: Yayın tarihi (YYYY-MM-DD formatında)
   - `BLOG_READ_TIME`: Tahmini okuma süresi
   - `BLOG_CATEGORY`: Blog kategorisi
   - `BLOG_IMAGE`: Ana görsel dosya adı
   - `BLOG_CONTENT`: Blog yazısının içeriği

4. **Görselleri Ekleyin**: Blog yazısı ile ilgili görselleri aynı klasöre ekleyin

5. **RSS Feed'i Güncelleyin**: `rss.xml` dosyasına yeni blog yazısını ekleyin

6. **Sitemap'i Güncelleyin**: `sitemap.xml` dosyasına yeni blog yazısını ekleyin

7. **Ana Sayfayı Güncelleyin**: Ana sayfadaki blog listesine yeni blog yazısını ekleyin (maksimum 5 blog)

8. **Tüm Bloglar Sayfasını Güncelleyin**: `/blogs/index.html` dosyasına yeni blog yazısını ekleyin

## RSS Feed

RSS feed dosyası: `/rss.xml`

Yeni blog yazısı eklediğinizde RSS feed'e şu formatta ekleyin:

```xml
<item>
    <title>Blog Yazısı Başlığı</title>
    <description>Blog yazısı açıklaması</description>
    <link>https://cenullum.com/blogs/blog_yazisi_adi/</link>
    <guid isPermaLink="true">https://cenullum.com/blogs/blog_yazisi_adi/</guid>
    <pubDate>Mon, 27 Jan 2025 12:00:00 +0000</pubDate>
    <category>Kategori</category>
</item>
```

## Sitemap

Sitemap dosyası: `/sitemap.xml`

Yeni blog yazısı eklediğinizde sitemap'e şu formatta ekleyin:

```xml
<url>
    <loc>https://cenullum.com/blogs/blog_yazisi_adi/</loc>
    <lastmod>2025-01-27</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
</url>
```

## Özellikler

- ✅ Responsive tasarım
- ✅ Ana sayfaya dönüş butonu (site dil ayarına göre)
- ✅ SEO optimizasyonu
- ✅ RSS feed desteği (SVG logo ile)
- ✅ Sitemap entegrasyonu
- ✅ Sosyal medya meta etiketleri
- ✅ Okuma süresi gösterimi
- ✅ Kategori sistemi
- ✅ Tarih gösterimi
- ✅ Tüm blog paneli tıklanabilir
- ✅ Ana sayfada 5 blog sınırı
- ✅ Tüm blogları gör sayfası

## Örnek Kullanım

```bash
# Yeni blog yazısı oluşturma
mkdir blogs/pixel_art_rehberi
cp blogs/blog-template.html blogs/pixel_art_rehberi/index.html
# index.html dosyasını düzenleyin
# Görselleri ekleyin
# RSS ve sitemap'i güncelleyin
```
