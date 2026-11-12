# Toz yöntemi: 14 Bravais örgüsü için çizgi şemaları

**Konum:** Toz Yöntemi → 2θ Taraması; aktif tarama simülasyonunun altında.

## Kapsam

- **7 kristal sistemi, 14 Bravais tipi ve 28 malzeme örneği** (tip başına iki örnek).
- Her örnekte konvansiyonel örgü parametrelerinden türetilmiş **ilk 18 farklı** izinli yansımanın konumu, 10°–110° 2θ aralığında gösterilir.
- Kullanılan ışınım: **Cu Kα₁, λ = 1,5406 Å**; kırınım koşulu **2d sin θ = λ**.
- Eğik kristal sistemlerinde (monoklinik, triklinik) bütün eksen açılarını kullanan ters örgü metriği uygulanır.
- Merkezleme kuralları: P (yok); I (h+k+l çift); F (h,k,l aynı paritede); C (h+k çift); R (hekzagonal eksenlerde −h+k+l = 3n).
- Yakın konumlu yansımalar **0,065°** çözünürlükle bir çizgiye birleştirilir. Grafikteki hkl temsili bir indis, her çizgiye karşılık gelen tüm eşdeğer indisleri listelemez.\n- İlk görünüm, seçilmiş düşük açılı yansımaları daha rahat okumak için **örnek bazında 2θ yakınlaştırma** uygular. İşaretlenebilir **ortak 10°–110° ekseni** ise malzemelerin çizgi konumlarını aynı açısal ölçekte karşılaştırır.

## Bilimsel sınırlar

**Bu desenler ölçülmüş XRD verisi değildir.** Gerçek malzeme adları ve yaklaşık hücre sabitleri, Bravais örgüsü kavramını göstermek için kullanılır. Ancak **atomik bazın yapı faktörü**, **vida ekseni/kayma düzlemi sistematik sönümleri**, çokluk, absorpsiyon, sıcaklık faktörü, tercihli yönelim, Cu Kα₂ bileşeni, pik şiddeti ve cihaz etkileri hesaplanmaz. Dolayısıyla çizilen izinli bir Bravais yansıması gerçek malzemenin ölçülen deseninde yok olabilir; eksik/yönlü şiddet yorumu yapılamaz.

Özellikle **R-3c kalsit/korindon**, **P4₂/mnm rutil**, **I4₁/amd anataz**, **Fddd tenardit** gibi uzay gruplarında Bravais seçim kuralından daha fazla sönüm bulunur. Bu uygulamada bu ek sönümler *bilerek uygulanmaz*. Daha yüksek doğruluk için CIF atom konumlarından kompleks yapı faktörü ve uzay grubu yansıma koşullarının hesaplanması gerekir.

Parametreler yaklaşık ve örnek faz/oda sıcaklığına özgüdür. Malzemenin başka polimorfu veya sıcaklığı başka örgü ve parametreler verebilir.

## Çekirdek hesap

1. Hücre kenarları ve α, β, γ açılarından gerçek uzay baz vektörleri **a**, **b**, **c** hesaplanır.
2. Ters baz vektörleri **a\*** = (**b** × **c**) / V vb. olarak bulunur; burada 2π kullanılmayan konvansiyon seçilmiştir.
3. Her (hkl) için **d = 1 / |h a\* + k b\* + l c\*|**.
4. Merkezleme seçim kuralına uyan yansımalar için 2θ = 2 arcsin(λ / 2d).
5. 10°–110° aralığındaki ilk 18 farklı çizgi yatay film şemasına yerleştirilir.

## Yapısal kaynaklar

- [Oxford Instruments — Basic Concepts of Crystallography](https://www.ebsd.com/ebsd-explained/basic-concepts-of-crystallography): 14 Bravais örgüsünün sınıflandırılması.
- [IUCr — Bravais lattice classification](https://journals.iucr.org/a/issues/2015/02/00/eo5044/index.html): konvansiyonel örgüler ve eşdeğerlikler.
- [TiO₂ rutile, anatase, brookite — Materials review](https://pmc.ncbi.nlm.nih.gov/articles/PMC8036967/): polimorflar ve örgü sabitleri.
- [NIST — Monoclinic ZrO₂](https://srdata.nist.gov/CeramicDataPortal/Scd/Z00179): mP örneği.
- [IUCr — β-Ga₂O₃](https://journals.iucr.org/j/issues/2018/05/00/vh5085/): mC örneği.
- [AFLOW — NaNO₂ oI](https://aflowlib.duke.edu/p/JZVB/): oI uzay grubu ve örnek.
- [AFLOW — Thenardite oF](https://aflowlib.duke.edu/p/8CBQ/): Na₂SO₄ ve Ag₂SO₄ Fddd ailesi.
- [Na₂SO₄ hücre sabitleri](https://www.mindat.org/min-3935.html); [Ag₂SO₄ hücre sabitleri](https://link.springer.com/article/10.1007/s10854-015-3221-y).
- [LiCuVO₄ oI hücre sabitleri](https://4ab.in/crystal-structure/structures/ABC4D_oI28_74_a_c_hi_e-001/).
- [Microcline hücre sabitleri](https://www.mindat.org/min-2704.html).
- [Black phosphorus Cmca](https://onlinelibrary.wiley.com/doi/10.1002/eem2.70255).
- [Indium I4/mmm](https://www.webelements.com/indium/crystal_structure.html/crystal_structure.html).

Test: `node --test tests/bravais-powder-atlas.test.cjs` (ve tüm paket bağımsız testler için `node --test tests/*.test.cjs`).
