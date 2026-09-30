# X-Işını Kırınımı — Etkileşimli Ders Özeti

Bu depo, **X-ışını kırınımı (XRD), kristalografi ve toz kırınımı** konularını tek sayfalık, etkileşimli bir ders özeti olarak sunar.

Amaç; kapsamlı bir kristalografi veya Rietveld yazılımının yerini almak değil, derste karşılaşılan temel kavramları **formüller, görselleştirmeler, küçük simülasyonlar ve örnek analizlerle** birbirine bağlamaktır.

> **Kapsam notu:** Sayfadaki simülasyon ve analizler eğitim amaçlıdır. Gerçek deneysel verinin nicel analizi; cihaz geometrisi, kalibrasyon, numune hazırlama, absorpsiyon, tercihli yönelim, pik profili, belirsizlikler ve kullanılan yöntemin varsayımları gibi ek etkilerin değerlendirilmesini gerektirir.

## İçerik

Ders özeti yedi ana bölümden oluşur:

1. **Kristalografi**
   - Birim hücre ve örgü parametreleri
   - Yedi kristal sistemi ve Bravais örgüleri
   - Miller indisleri ve düzlemler arası uzaklık
   - Kristal yapıların üç boyutlu gösterimi

2. **X-ışınları ve Bragg kırınımı**
   - X-ışınlarının oluşumu ve karakteristik çizgiler
   - Bragg yasası: \(n\lambda = 2d\sin\theta\)
   - Yapıcı girişim
   - Gerçek uzay ↔ ters uzay dönüşümü
   - Dual baz vektörleri ve gerçek örgü / ters örgü aralığı ilişkisi
   - (hk) düzlem ailesi ↔ g_hk ters örgü noktası ve |g| = 1/d bağıntısı
   - Eğik örgülerde ters bazın geometrisi
   - Fourier bakışıyla ters örgü ve q = k − k₀ bağlantısı
   - Ters örgü ve Ewald yapısı
   - Yapı faktörü ve sistematik sönümler

3. **Toz kırınım yöntemi**
   - Rastgele yönlenmiş kristalitler
   - Debye–Scherrer konileri ve halkaları
   - Toz deseninin oluşumu
   - Pik konumu, şiddeti ve biçimini belirleyen etkenler
   - Atomik saçılma faktörü, çokluk, Lorentz–polarizasyon ve Debye–Waller etkileri

4. **Desen simülatörü**
   - Farklı kristal yapıların hesaplanan toz desenleri
   - Örgü parametresi ve ışın kaynağının etkisi
   - Sistematik sönümler
   - Kristalit boyutu ve pik genişlemesi
   - Kα bileşenlerinin etkisi

5. **Veri analizi**
   - Kübik desenlerin indekslenmesi
   - Örgü parametresinin belirlenmesi
   - Hanawalt/search-match yaklaşımı
   - Scherrer kristalit boyutu
   - Rietveld yönteminin temel fikri

6. **Pratik kullanım ve ileri konular**
   - Ölçüm ve analiz iş akışı
   - Faz tanıma ve nicel analiz kavramları
   - Williamson–Hall ve profil analizi
   - Makine öğrenmesinin XRD'deki olası kullanım alanları
   - Sınıflandırma, faz tanıma, regresyon, denoising, NMF/PCA ve otomatik indeksleme örnekleri

7. **Gerçek XRD verisini okumak**
   - İdeal ve ölçülen desenin karşılaştırılması
   - Numune yüksekliği / yer değiştirmesinin pik konumlarına etkisi
   - Tercihli yönelim ve bağıl şiddet değişimleri
   - Kristalit boyutu ve mikrogerinim kaynaklı pik genişlemesi
   - Amorf arka plan, sayım istatistiği ve Kα₂ bileşeninin görsel etkileri
   - Konum, genişlik, şiddet ve arka plan değişimlerini ayırt etmeye yönelik etkileşimli tanıma laboratuvarı

## Sayfa nasıl kullanılmalı?

İçerik doğrusal biçimde **Kristalografi → Bragg → Toz yöntemi → Simülasyon → Veri analizi → Pratik kullanım → Gerçek veriyi okuma** sırasıyla takip edilebilir. Ancak her bölüm bağımsız bir ders tekrarı olarak da kullanılabilir.

Kaydırıcılar ve seçim kutuları yalnızca sonucu göstermek için değil, kavramlar arasındaki ilişkiyi görünür kılmak için tasarlanmıştır. Örneğin örgü parametresi değiştirildiğinde pik konumlarının, kristalit boyutu değiştirildiğinde pik genişliğinin ve atomik düzen değiştirildiğinde izinli/sönen yansımaların nasıl değiştiği gözlenebilir.

## Bilimsel kapsam ve sadeleştirmeler

Sayfa temel **kinematik kırınım** yaklaşımını ve yaygın laboratuvar tipi toz XRD kavramlarını öğretmeyi hedefler. Formüller, simülasyonlar ve örnekler bu eğitim kapsamına göre sadeleştirilmiştir.

Özellikle aşağıdaki noktalar göz önünde bulundurulmalıdır:

- Bragg yasası bir yansımanın geometrik koşulunu verir; yansımanın şiddeti ayrıca yapı faktörüne ve deneysel/geometrik düzeltmelere bağlıdır.
- Sistematik sönümler yapı faktörünün belirli yansımalar için sıfır olmasıyla ilişkilidir ve uzay grubu/simetri bilgisi taşır.
- Scherrer bağıntısı pik genişlemesinden **koherent kırınım bölgesi boyutu** için yaklaşık bir değer verir; parçacık boyutuyla her durumda eş anlamlı değildir. Cihaz genişlemesi ve gerinim gibi diğer katkılar gerçek ölçümlerde ayrıca değerlendirilmelidir.
- Williamson–Hall yaklaşımı boyut ve mikrogerinim katkılarını ayırmak için kullanılan yaklaşık bir profil yöntemidir; varsayımları her numune için geçerli olmayabilir.
- Search-match/Hanawalt örnekleri faz tanımanın mantığını öğretir; gerçek faz tanımlaması kapsamlı referans veritabanları ve deneysel kontroller gerektirir.
- Rietveld yöntemi tek tek pikleri eşleştirmekten farklı olarak tüm toz kırınım profilini hesaplanan bir modelle uydurur. Sayfadaki bölüm yöntemin mantığını öğretir; tam özellikli bir Rietveld yazılımı değildir.
- Simüle edilen şiddetler eğitim amacıyla idealleştirilmiştir. Gerçek ölçümlerde absorpsiyon, tercihli yönelim, floresans, numune yer değiştirmesi, cihaz fonksiyonu ve benzeri etkiler deseni değiştirebilir.
- Makine öğrenmesi bölümü yöntemlerin XRD'ye nasıl uygulanabileceğini açıklayan ileri düzey bir giriş niteliğindedir; gösterilen mimariler tek veya evrensel çözüm olarak düşünülmemelidir.

## Temel bağıntılar

**Bragg yasası**

\[
n\lambda = 2d\sin\theta
\]

**Kübik kristallerde düzlemler arası uzaklık**

\[
\frac{1}{d_{hkl}^{2}} = \frac{h^{2}+k^{2}+l^{2}}{a^{2}}
\]

**Yapı faktörü**

\[
F_{hkl}=\sum_j f_j\exp\left[2\pi i(hx_j+ky_j+lz_j)\right]
\]

Atomik yerleşim nedeniyle bazı \(F_{hkl}\) değerleri sıfır olabilir; bu durum sistematik sönümlerin temelini oluşturur.

**Scherrer bağıntısı**

\[
D=\frac{K\lambda}{\beta\cos\theta}
\]

Burada \(\beta\), uygun cihaz genişliği düzeltmesinden sonra kullanılan pik genişliğidir ve radyan cinsinden ifade edilir.

## Dil ve arayüz

Sayfa:

- Türkçe ve İngilizce içerik,
- açık/koyu tema,
- masaüstü ve mobil uyumlu düzen,
- etkileşimli 2B/3B görselleştirmeler,
- önemli kavram ve sonuç kutularında bağlamsal bilgi ikonları ve açıklama modalları

sunar.

Uygulama doğrudan tarayıcıda çalışır; ayrı bir kurulum veya sunucu tarafı uygulama gerektirmez.

## Kaynaklar ve ileri okuma

İçeriğin temel kavramsal çerçevesi standart kristalografi ve toz kırınım literatürüyle uyumludur. Konuları daha ayrıntılı incelemek için:

- B. D. Cullity & S. R. Stock, *Elements of X-Ray Diffraction*.
- H. P. Klug & L. E. Alexander, *X-Ray Diffraction Procedures*.
- R. A. Young (Ed.), *The Rietveld Method*, IUCr/Oxford University Press.
- *International Tables for Crystallography, Volume H: Powder Diffraction*.
- International Union of Crystallography (IUCr) eğitim materyalleri ve Online Dictionary of Crystallography.

Sayfanın içindeki ileri konularda ilgili çalışmalara ayrıca kısa literatür atıfları verilmiştir.

## Projenin amacı

Bu çalışma bir üretim tipi XRD analiz paketi değil, **ders sırasında veya ders sonrasında kavramların hızlıca tekrar edilebildiği etkileşimli bir öğrenme materyalidir**.

Katkılar; özellikle bilimsel ifade düzeltmeleri, daha anlaşılır görselleştirmeler, eğitim örnekleri ve kaynak önerileri açısından memnuniyetle karşılanır.
