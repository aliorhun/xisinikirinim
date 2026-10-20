/* XRD kazanım ve oyun laboratuvarı — çevrimdışı, TR/EN */
(function (root) {
  "use strict";
  var PI = Math.PI, RAD = PI / 180, WAVE = 1.5406;
  var physical = {
    dCubic: function(a,h,k,l){ return a/Math.sqrt(h*h+k*k+l*l); },
    twoTheta: function(lambda,d){ return lambda>2*d?NaN:2*Math.asin(lambda/(2*d))/RAD; },
    cubicA: function(lambda,twoTheta,h,k,l){ return lambda*Math.sqrt(h*h+k*k+l*l)/(2*Math.sin(twoTheta*RAD/2)); },
    allowed: function(type,h,k,l){ return type==="P"||(type==="I"?(h+k+l)%2===0: h%2===k%2&&k%2===l%2); },
    phaseIntensity: function(d,theta,lambda){ var x=2*PI*2*d*Math.sin(theta*RAD)/lambda;return 4*Math.cos(x/2)*Math.cos(x/2); },
    whDegrees: function(Dnm,strain,theta){ return (0.9*WAVE/(Dnm*10*Math.cos(theta*RAD))+4*strain*Math.tan(theta*RAD))/RAD; }
  };
  var chapterGoals = {
    1:["Birim hücre, simetri ve Bravais örgüsünü ayırt etmek¦Distinguish unit cells, symmetry and Bravais lattices",
       "Miller indislerini kesişimlerden yorumlamak¦Interpret Miller indices from intercepts",
       "Kübik d(hkl) değerinin a ve hkl ile ilişkisini hesaplamak¦Calculate cubic d(hkl) from a and hkl",
       "Örgü ile atomik bazı ayırmak¦Separate the lattice from the atomic basis",
       "Kırınım koşulunu düzlem aralığıyla ilişkilendirmek¦Relate diffraction geometry to interplanar spacing"],
    2:["X-ışını kaynağı ve dalga boyunu açıklamak¦Explain X-ray sources and wavelength",
       "Bragg açısı θ ile ölçülen 2θ'yi ayırmak¦Distinguish Bragg θ from measured 2θ",
       "Yol ve faz farkını yapıcı girişimle ilişkilendirmek¦Link path difference and phase to interference",
       "Ters uzay ve Ewald geometrisini yorumlamak¦Interpret reciprocal space and Ewald geometry",
       "Yapı faktörünün izinli/sönen yansımaları belirlediğini göstermek¦Show how structure factors govern allowed/extinct reflections"],
    3:["Rastgele yönelimli kristalitlerin rolünü açıklamak¦Explain the role of randomly oriented crystallites",
       "2θ ile Debye–Scherrer konisini ve halkayı ilişkilendirmek¦Relate 2θ to Debye–Scherrer cones and rings",
       "Halkalardan 1B difraktogram oluşumunu anlatmak¦Explain how rings yield a 1D diffractogram",
       "Tercihli yönelimin şiddetleri nasıl değiştirdiğini yorumlamak¦Interpret how texture changes intensities",
       "Bragg–Brentano tarama geometrisini ayırt etmek¦Distinguish Bragg–Brentano scan geometry"],
    4:["Desen hesaplamasında d, 2θ ve hkl ilişkisini kurmak¦Relate d, 2θ and hkl in pattern calculation",
       "İlkel/HMK/YMK seçim kurallarını uygulamak¦Apply P/BCC/FCC selection rules",
       "Örgü parametresi değişiminin pik konumuna etkisini bulmak¦Predict how lattice parameter shifts peaks",
       "Kristalit boyutu ile pik genişliğini ayırmak¦Relate coherent domain size to peak broadening",
       "Pik şiddetinde yapı faktörü ve diğer düzeltmeleri tanımak¦Recognise structure-factor and other intensity corrections"],
    5:["Kübik pikleri sin²θ ve N ile indekslemek¦Index cubic peaks using sin²θ and N",
       "Ölçülen 2θ'den örgü parametresi çıkarmak¦Infer lattice parameter from measured 2θ",
       "Search-match ile faz tanımanın mantığını açıklamak¦Explain phase identification by search-match",
       "Scherrer genişliğinde cihaz katkısını hesaba katmak¦Account for instrument broadening in Scherrer analysis",
       "Rietveld'in tüm profil yaklaşımını anlamak¦Understand Rietveld whole-pattern refinement"],
    6:["Pik konumu, alanı ve profil biçimini ayırmak¦Distinguish peak position, area and profile shape",
       "Boyut ile mikrogerinim genişlemelerini yorumlamak¦Interpret size and microstrain broadening",
       "Ölçüm ve analiz iş akışındaki kalite kontrollerini sıralamak¦Identify measurement and analysis quality checks",
       "Faz araması ile nicel rafinasyonu ayırmak¦Differentiate phase search from quantitative refinement",
       "ML sonuçlarında dağılım dışı belirsizliğe dikkat etmek¦Recognise out-of-distribution uncertainty in ML"],
    7:["Pik kayması ile pik genişlemesini ayırt etmek¦Distinguish peak shift from broadening",
       "Tercihli yönelim kaynaklı bağıl şiddet değişimini tanımak¦Recognise texture-induced relative-intensity changes",
       "Amorf tümsek, gürültü ve Kα₂ etkilerini görmek¦Recognise amorphous humps, noise and Kα₂ effects",
       "Tek pike bakarak kesin neden atamamak¦Avoid drawing conclusions from a single peak",
       "Ölçüm artefaktlarıyla numune özelliklerini ayırmak¦Separate measurement artefacts from specimen properties"]
  };
  var subGoals = {
    s3a:["Rastgele ve yönelimli tozları karşılaştırmak¦Compare random and textured powders","Kristalit ile koherent bölgeyi ayırmak¦Distinguish a grain from a coherent domain"],
    s3b:["Koninin yarı açısının 2θ olduğunu göstermek¦Identify cone half-angle 2θ","Halkaların açısal yarıçapını yorumlamak¦Interpret ring angular radius"],
    s3c:["Azimutal toplamayla 1B desen üretimini açıklamak¦Explain azimuthal integration","Halka bütünlüğünün sayımı etkilediğini görmek¦See how ring completeness affects intensities"],
    s3d:["Bragg–Brentano odaklama geometrisini açıklamak¦Explain Bragg–Brentano focusing","Numune yerleşiminin ölçüme etkisini görmek¦Recognise sample-placement effects"],
    s3e:["θ–θ ile θ–2θ taramalarını karşılaştırmak¦Compare θ–θ and θ–2θ scanning","Dedektörün 2θ açısını ölçtüğünü göstermek¦Identify the detector angle 2θ"],
    s4a:["Yansıma listesinden profil üretim sırasını bilmek¦Know the reflection-to-profile pipeline","Şiddet ve konum hesaplarını ayırmak¦Separate intensity and position calculations"],
    s4b:["a, λ, boyut girdilerini ayrı ayrı değiştirmek¦Vary a, λ and domain size separately","Pik değişiminin nedenini doğru atamak¦Attribute peak changes to their causes"],
    s4c:["Koni ile halka arasındaki bağı göstermek¦Explain the cone-to-ring relationship","İdeal toz ile tek kristal sinyalini ayırmak¦Distinguish powder and single-crystal signals"],
    s4d:["HMK ve YMK seçim kurallarını uygulamak¦Apply BCC and FCC selection rules","Sönme ile düşük şiddeti ayırmak¦Distinguish extinction from low intensity"],
    s5a:["sin²θ oranlarından N değerlerini bulmak¦Infer N from sin²θ ratios","Aday a değerlerini çoklu pikle doğrulamak¦Validate a using multiple peaks"],
    s5b:["En güçlü d/I piklerini karşılaştırmak¦Compare strongest d/intensity lines","Tek pikle faz kimliğinin kesinleşmediğini açıklamak¦Explain why a single peak cannot identify a phase"],
    s5c:["Cihaz katkısını çıkardıktan sonra D kestirmek¦Estimate D after instrumental correction","D'nin parçacık boyutuna eşit olmadığını bilmek¦Recognise D is not necessarily particle size"],
    s5d:["Gözlenen-hesaplanan fark eğrisini yorumlamak¦Interpret observed-minus-calculated residuals","Rietveld model ve varsayımlarını ayırmak¦Separate Rietveld models and assumptions"],
    s6a:["Gauss/Lorentz/pseudo-Voigt'i tanımak¦Recognise Gaussian/Lorentzian/pseudo-Voigt","Williamson–Hall eğiminin gerinime bağını kurmak¦Relate Williamson–Hall slope to strain"],
    s6b:["Ham ölçümden rapora kalite kontrol sırasını kurmak¦Sequence quality controls from raw data to report","Kalibrasyon ve veri kökenini korumak¦Preserve calibration and data provenance"],
    s6c:["Arıtım parametrelerinin karşılıklı bağımlılığını görmek¦Recognise correlation among refinement parameters","Uyum istatistiği ile fiziksel geçerliliği ayırmak¦Separate fit statistics from physical validity"],
    s6d:["Referans desenleri çoklu pikle eşleştirmek¦Match references using multiple peaks","Karışım ve örtüşen pik sorunlarını tanımak¦Recognise mixtures and overlapping peaks"],
    s6e:["Sınıflandırma ile regresyon çıktısını ayırmak¦Distinguish classification from regression","Eğitim dağılımı dışındaki tahminleri sorgulamak¦Question predictions beyond training data"],
    s7a:["Konum/genişlik/şiddet/arkaplan izlerini okumak¦Read position/width/intensity/background signatures","Birden fazla fiziksel nedeni göz önünde tutmak¦Consider competing physical causes"],
    s7b:["İdeal ve bozunmuş desenleri üst üste incelemek¦Overlay ideal and perturbed patterns","Her bozunmanın görsel imzasını keşfetmek¦Discover the signature of each perturbation"],
    s7c:["Ölçüm artefaktı ve numune özelliklerini ayırmak¦Separate measurement artefacts from specimen properties","Sonucu birden fazla pik ve kontrolle sınamak¦Cross-check using multiple peaks and controls"]
  };
  function Q(g,sub,ask,choices,correct,why,errors,mode){
    return {g:g,sub:sub,ask:ask,choices:choices,answer:correct,why:why,errors:errors,mode:mode};
  }
  var questions = {
   1:[
    Q(0,"s1a","a=b=c ölçülmesi tek başına kübik simetriyi kanıtlar mı?¦Does measured a=b=c alone prove cubic symmetry?",["Evet; üç sayı yeterli¦Yes, three numbers suffice","Hayır; simetri işlemleri de gerekir¦No, symmetry operations are needed","Sadece atom numarasına bakılır¦Only atomic number matters"],1,"Metrik eşitlikler tesadüfi olabilir; kristal sistemi nokta simetrisiyle belirlenir.¦Metric coincidences are possible; point symmetry determines the crystal system.",["Sadece kenar uzunluklarına bakmak simetriyi ispatlamaz.¦Cell lengths alone cannot prove symmetry","","Atom numarası kristal sistemini belirlemez.¦Atomic number does not determine the crystal system."],0),
    Q(1,"s1b","(100) düzlemi kübik hücrede hangi ekseni keser?¦Which axis does cubic (100) intercept?",["Yalnız a eksenini¦Only the a-axis","Üç ekseni eşit¦All three equally","Yalnız c eksenini¦Only the c-axis"],0,"(100), a eksenini a'da keser ve b,c'ye paraleldir. Bölüm: Miller indisleri.¦(100) intercepts a at a and is parallel to b,c. See Miller indices.",["","(111) üç ekseni eşit keser; (100) değil.¦(111) intercepts all three, not (100).","Bu (001) olurdu.¦That would be (001)."],0),
    Q(2,"s1d","a sabitken (100) yerine (110) seçilirse d nasıl değişir?¦At fixed a, how does d change from (100) to (110)?",["√2 kat artar¦It increases by √2","1/√2 katına düşer¦It becomes 1/√2 as large","Hiç değişmez¦No change"],1,"Kübikte d=a/√(h²+k²+l²); N=1'den 2'ye çıkar, aralık azalır.¦For cubic crystals d=a/√N; N rises from 1 to 2, so spacing shrinks.",["Paydadaki N büyürken d büyümez.¦A larger denominator N cannot increase d.","","Miller indisleri düzlem aralığını değiştirir.¦Miller indices affect plane spacing."],0),
    Q(3,"s1a","Aynı Bravais örgüsüne farklı atomik baz eklenirse ne değişebilir?¦What can change when a different basis is attached to the same Bravais lattice?",["Yalnız Bravais sınıfı¦Only Bravais type","Yapı faktörü ve şiddetler¦Structure factors and intensities","Bragg yasasının matematiği¦The mathematics of Bragg's law"],1,"Atomların kesirli konumları fazları değiştirir; Bravais örgüsü tek başına şiddeti belirlemez.¦Fractional atomic positions change phases; the lattice alone does not determine intensity.",["Bravais sınıfı aynı kalabilir.¦The Bravais type can remain unchanged.","","Bragg geometrisi geçerliliğini korur.¦Bragg geometry remains valid."],1),
    Q(4,"s1d","a artar ve (hkl) aynı kalırsa ilk mertebe 2θ nasıl değişir?¦If a increases at fixed (hkl), what happens to first-order 2θ?",["Artar¦Increases","Azalır¦Decreases","Şiddetle aynıdır¦It becomes the intensity"],1,"d artar; nλ=2d sinθ bağıntısında sabit λ için θ küçülür.¦d grows, and for fixed λ the Bragg angle falls.",["d ve açıyı ters bağladık: büyüyen d için θ küçülür.¦d and angle vary inversely at fixed wavelength.","","2θ bir açıdır, şiddet değil.¦2θ is an angle, not an intensity."],1)
   ],
   2:[
    Q(0,"s2a","Tüp gerilimi K kabuğu eşiğinin altındaysa hangisi doğrudur?¦If tube voltage is below the K-edge threshold, which is true?",["Kα çizgisi yine kesin vardır¦Kα is necessarily present","K karakteristik çizgisi uyarılamaz¦A K characteristic line cannot be excited","Bragg açısı sıfır olur¦Bragg angle becomes zero"],1,"Kα için önce K kabuğunda boşluk açılması gerekir; frenleme ışıması yine bulunabilir.¦Kα needs a K-shell vacancy; bremsstrahlung may still occur.",["K boşluğu açılamıyorsa Kα üretilmez.¦No Kα if K vacancies cannot be produced.","","Kaynak eşiği ile numunenin Bragg açısı ayrı konulardır.¦Source threshold and Bragg angle are unrelated."],0),
    Q(1,"s2b","Dedektörde tepe 2θ=60° ise Bragg θ kaçtır?¦If the detector peak is at 2θ=60°, what is Bragg θ?",["60°","30°","120°"],1,"Difraktogram yatay ekseni çoğunlukla 2θ'dir; Bragg denklemine giren θ=30° olur.¦XRD typically plots 2θ; θ=30° enters Bragg's equation.",["2θ değerini θ yerine koymayın.¦Do not substitute 2θ for θ.","","θ, ölçülen açının iki katı değildir.¦θ is not twice the reported angle."],0),
    Q(2,"s2sc","Eş genlikli iki dalga π faz farkıyla geldiğinde net alan ve ideal şiddet nedir?¦With equal amplitudes and a π phase difference, what are net field and ideal intensity?",["Net alan sıfır; şiddet sıfır¦Net field zero; intensity zero","Net alan iki kat; şiddet dört kat¦Double field; quadruple intensity","Dalgalar hiç saçılmaz¦There is no scattering"],0,"Aynı yerde E₁+E₂=0; yoğunluk |E₁+E₂|² ile orantılıdır. Tek tek katkılar vardır fakat söner.¦At the same place E₁+E₂=0 and intensity scales with |E₁+E₂|²; scattering contributions still exist.",["","Bu durum 0 veya 2π faz farkında olur.¦That is for 0 or 2π phase difference.","Katkılar vardır; toplam birbirini götürür.¦Contributions exist but cancel."],0),
    Q(3,"s2c","Ters örgü vektörünün büyüklüğü (çevrim/Å tanımı) nedir?¦In cycles/Å convention, what is reciprocal-vector magnitude?",["d","1/d","λ·d"],1,"Karşılık gelen (hkl) düzlemlerinin ters örgü uzaklığı |g|=1/d'dir.¦For matching (hkl), |g|=1/d in the cycles convention.",["d gerçek uzay uzunluğudur; ters uzayın birimi 1/Å.¦d is a real-space length; reciprocal space has inverse-length units.","","λd ters uzunluk biriminde değildir.¦λd does not have inverse-length units."],1),
    Q(4,"s2d","HMK (100) için eşit atomlu merkezleme yapı faktörü ne olur?¦For monoatomic BCC (100), what is the centering structure factor?",["Sıfır¦Zero","İki kat güçlü¦Twice the amplitude","Her zaman ölçülür¦Always observed"],0,"1+exp[iπ(h+k+l)]=0 çünkü h+k+l tektir; Bragg geometrisi tek başına yeterli değildir.¦1+exp[iπ(h+k+l)]=0 for odd sums; Bragg geometry alone is insufficient.",["","Çift toplamda genlik iki kat olur.¦The amplitude doubles for an even sum.","Geometrik koşul şiddet garantilemez.¦Geometry does not guarantee intensity."],1)
   ],
   3:[
    Q(0,"s3a","Çok sayıda rastgele yönlenmiş kristalit neden faydalıdır?¦Why are many randomly oriented crystallites useful?",["Farklı (hkl) Bragg koşullarını sağlar¦They satisfy many (hkl) Bragg conditions","Tüm atomları aynı yöne döndürür¦They align all atoms","Dalga boyunu değiştirir¦They change X-ray wavelength"],0,"Her (hkl) için uygun yönelimli kristalitler bulunur; ölçümde yansıma çeşitliliği artar.¦Some grains have the needed orientation for each (hkl), increasing reflection coverage.",["","Rastgele olmak hizalamak değildir.¦Random is not aligned.","Kristalit yönelimi kaynak dalga boyunu değiştirmez.¦Orientation does not change the source wavelength."],0),
    Q(1,"s3b","Bir Debye–Scherrer konisinin gelen ışına göre yarı açısı nedir?¦What is the half-angle of a Debye–Scherrer cone to the incident beam?",["θ","2θ","90°"],1,"Saçılmış demetin gelen ışınla açısı 2θ'dir; koninin yarı açısı da budur.¦The scattering direction makes an angle 2θ to the incident beam; so does the cone.",["θ kristal düzlemiyle ilgili Bragg açısıdır.¦θ is the Bragg angle to the planes.","","Her yansımanın açısı farklıdır; 90° sabit değildir.¦The angle varies by reflection, not a fixed 90°."],0),
    Q(2,"s3c","2B halkadan 1B 2θ–şiddet eğrisi nasıl elde edilir?¦How do you obtain a 1D intensity-vs-2θ profile from a 2D ring?",["Azimut boyunca bütünleştirerek¦By azimuthal integration","Sadece tek bir pikseli seçerek¦By selecting one pixel","Açı eksenini silerek¦By removing the angle axis"],0,"Aynı 2θ yarıçapındaki dedektör pikselleri uygun düzeltmelerle birleştirilir.¦Detector pixels at matching 2θ are combined with suitable corrections.",["","Tek piksel istatistik ve doku açısından temsili değildir.¦One pixel is unrepresentative statistically and for texture.","Açı bilgisi mutlaka korunur.¦Angular information must be preserved."],0),
    Q(3,"s3a","Halkalar kesintili noktalardan oluşuyorsa önce neyi düşünürüz?¦If rings are spotty rather than continuous, what is a likely cause?",["İri/az kristalit ve yetersiz yönelim örneklemesi¦Too few/large grains and poor orientation statistics","Kâğıttaki çizim hatasıdır¦Always a drawing error","Yalnız dalga boyu küçülmüştür¦Only wavelength decreased"],0,"Az sayıda difraksiyon yapan kristalit, halka boyunca sürekli istatistik oluşturmayabilir.¦Too few diffracting grains may give incomplete azimuthal sampling.",["","Noktalanma fiziksel numune etkisi de olabilir.¦Spotty rings can be a specimen effect.","λ tek başına azimutal sürekliliği bozmaz.¦Wavelength alone does not break azimuthal continuity."],1),
    Q(4,"s3e","θ–2θ taramasında detektör açısından ne okunur?¦In a θ–2θ scan, what detector angle is read?",["2θ","θ/2","λ"],0,"Kırınım tepesinin konumu dedektör saçılma açısı 2θ ile raporlanır.¦Peak positions are reported on the detector scattering-angle 2θ axis.",["","θ/2 Bragg–Brentano açısının tanımı değildir.¦θ/2 is not the defined Bragg–Brentano detector angle.","λ bir uzunluktur, açı değildir.¦λ is a length, not an angle."],1),
    Q(4,"s3d","Bragg–Brentano ölçümünde numune yüksekliği yanlışsa ne olabilir?¦What may happen if sample height is wrong in Bragg–Brentano geometry?",["Ölçülen pik konumları sistematik kayabilir¦Measured peak positions may shift systematically","Bravais örgüsü değişir¦The Bravais lattice changes","Bütün (hkl) indisleri sıfırlanır¦All Miller indices become zero"],0,"Numune yer değiştirmesi odaklama geometrisini bozar; uygun açısal eğilimde pik kayması oluşturabilir.¦Specimen displacement perturbs focusing geometry and may systematically shift observed peaks.",["","Numune yüksekliği kristal simetrisini değiştirmez.¦Sample height does not change crystal symmetry.","Geometrik yerleştirme hkl indislerini yok etmez.¦Mounting geometry does not erase Miller indices."],1),
   ],
   4:[
    Q(0,"s4a","Desen üretiminde yansıma konumu için önce hangi bilgi gerekir?¦What is first needed to calculate a reflection position?",["d(hkl) ve λ¦d(hkl) and λ","Yalnız renk¦Only colour","Yalnız örnek kütlesi¦Only sample mass"],0,"Bragg bağıntısı d ve λ'dan 2θ konumunu verir. Şiddet ayrı faktörlere bağlıdır.¦Bragg's equation gives 2θ from d and λ. Intensity has separate factors.",["","Renk 2θ hesaplamasına girmez.¦Colour is not in the 2θ formula.","Numune kütlesi tek başına pikleri belirlemez.¦Specimen mass alone cannot set peak positions."],0),
    Q(1,"s4d","Eş atomlu YMK örgüsünde hangi yansıma izinlidir?¦Which reflection is allowed for a monoatomic FCC lattice?",["(100)","(110)","(111)"],2,"YMK için indisler ya tümü çift ya da tümü tek olmalıdır; (111) uygundur.¦FCC indices must be all even or all odd; (111) is allowed.",["Tek/çift karışımı olduğu için söner.¦Mixed parity makes (100) extinct.","(110) karışık parity için söner.¦(110) has mixed parity and is extinct.",""],0),
    Q(2,"s4b","a büyürken aynı hkl yansımasının 2θ'si nasıl değişir?¦As a increases, what happens to 2θ of a fixed hkl?",["Küçülür¦Decreases","Büyür¦Increases","Sabit kalır¦Stays fixed"],0,"d=a/√N artar, sinθ=λ/(2d) küçülür.¦d=a/√N grows and sinθ=λ/(2d) falls.",["","a ile 2θ ters yönlü değişir.¦a and 2θ move in opposite directions.","Sabit hkl için a etkisiz değildir.¦a matters at fixed hkl."],0),
    Q(3,"s4b","Koherent bölge küçülürse ideal Scherrer genişliği ne olur?¦If coherent domain size decreases, what happens to ideal Scherrer width?",["Azalır¦Decreases","Artar¦Increases","Pik konumu zorunlu değişir¦Peak position necessarily changes"],1,"β≈Kλ/(D cosθ); küçük D daha geniş pik demektir, fakat cihaz/gerinim de değerlendirilir.¦β≈Kλ/(D cosθ); smaller D broadens peaks, but instrument/strain contributions matter.",["Scherrer genişliği D ile ters orantılıdır.¦Scherrer width is inversely proportional to D.","","Genişleme zorunlu pik kayması değildir.¦Broadening is not necessarily a peak shift."],1),
    Q(4,"s4a","İzinli iki pikin yüksekliği yalnızca hkl sayısından mı hesaplanır?¦Do only Miller indices determine intensities of allowed peaks?",["Evet, bütün pikler eşittir¦Yes, all peaks are equal","Hayır; F, çokluk, LP, DW ve profil etkilidir¦No; F, multiplicity, LP, DW and profile matter","Yalnız a parametresi yeterlidir¦Only a suffices"],1,"İzinli olmak gözlenen şiddeti belirlemez; oyuncak grafik yalnız konumu gösterir.¦Being allowed does not determine measured intensity; this toy chart only shows positions.",["Gerçek göreli şiddetler farklıdır.¦Actual relative intensities differ.","","Örgü parametresi tek başına tüm şiddeti vermez.¦Lattice parameter alone does not determine intensity."],1),
    Q(0,"s4c","Rastgele yönlenmiş çok kristalli bir numunenin 2B difraksiyon görüntüsü idealde ne gösterir?¦In the ideal case, what does a 2D diffraction image of a random powder show?",["Eşmerkezli halkalar¦Concentric rings","Yalnız birkaç yönelimli nokta¦Only a few oriented spots","Hiçbir sinyal¦No signal"],0,"Bir düzlem ailesinin mümkün saçılma doğrultuları koni oluşturur; kesiti halka olur.¦Each plane family scatters onto a cone; its planar-detector intersection forms a ring.",["","Tek kristal tipik olarak ayrık noktalar verir.¦A single crystal typically gives discrete spots.","Bragg koşulunu sağlayan kristalitler sinyal üretir.¦Properly oriented crystallites still diffract."],1),
   ],
   5:[
    Q(0,"s5a","Kübik indekslemede sin²θ hangi sayıyla orantılıdır?¦In cubic indexing, sin²θ is proportional to what?",["N=h²+k²+l²","a²","1/I"],0,"sin²θ=λ²N/(4a²); izinli N dizileri olası örgü türlerini sınırlar.¦sin²θ=λ²N/(4a²); allowed N sequences constrain candidate lattices.",["","a² paydaya girer; orantı N iledir.¦a² occurs in the denominator; proportionality is to N.","Şiddet I bu geometri oranının parçası değildir.¦Intensity I is not part of this geometry ratio."],0),
    Q(1,"s5a","Kübik örnekte ölçülen 2θ ve (hkl) biliniyorsa a için hangi bağıntı kullanılır?¦Given 2θ and (hkl), which formula yields cubic a?",["a=λ√N/(2sinθ)","a=2λsinθ","a=λ/(Nsin2θ)"],0,"Önce θ=2θ/2 alınır, ardından d=λ/(2sinθ) ve a=d√N bulunur.¦First halve 2θ to get θ, then compute d=λ/(2sinθ) and a=d√N.",["","Bu ifade Bragg denkleminden çıkmaz.¦This does not follow from Bragg's law.","2θ'yi ve N çarpanını yanlış yerleştirir.¦It misuses 2θ and the N factor."],0),
    Q(2,"s5b","Hanawalt aramasında neden birden fazla güçlü pik karşılaştırılır?¦Why compare several strong peaks in Hanawalt search-match?",["Tek pik faza özgü olmayabilir¦A single peak may not be unique to a phase","Tüm maddelerin bir piki vardır¦Every substance has one peak","İndeksler gereksizdir¦Indices are unnecessary"],0,"Örtüşme ve karışımlar yüzünden güçlü d/I deseninin bütünü kontrol edilmelidir.¦Overlaps and mixtures require comparing the full strong-line d/I pattern.",["","Birçok fazın çok sayıda çizgisi vardır.¦Phases generally have multiple reflections.","Yapı ve indeksleme hâlâ önemlidir.¦Structure and indexing still matter."],1),
    Q(3,"s5c","Scherrer D hesaplamasında gözlenen FWHM doğrudan kullanılabilir mi?¦Can observed FWHM be used directly for Scherrer D?",["Her zaman¦Always","Hayır; en azından cihaz genişlemesi değerlendirilmeli¦No; instrument broadening must be assessed","İntensite ile çarpılır¦Multiply it by intensity"],1,"D, cihaz katkısı ve diğer genişleme kaynakları değerlendirildikten sonra yaklaşık koherent boyut verir.¦D estimates coherent domain size after assessing instrumental and other broadening.",["Cihaz genişlemesi D'yi sistematik saptırır.¦Instrument broadening biases D.","","Pik yüksekliği Scherrer paydasına bu şekilde girmez.¦Peak height is not a Scherrer multiplier."],1),
    Q(4,"s5d","Rietveld yaklaşımının ayırt edici özelliği nedir?¦What distinguishes Rietveld refinement?",["Yalnız ilk piki okumak¦Use only the first peak","Tüm hesaplanan profili gözlenen veriyle uyumlamak¦Fit the whole calculated profile to the observation","Rastgele hkl seçmek¦Choose arbitrary hkl"],1,"Arka plan, profil, yapı ve cihaz parametreleriyle bütün desen ve fark eğrisi birlikte değerlendirilir.¦Background, profile, structure and instrument parameters shape the whole pattern and residual.",["Tek pik tüm modelin tutarlılığını test etmez.¦One peak cannot validate a complete model.","","hkl keyfi seçilmez; yapı ve Bragg geometrisi gerekir.¦hkl must follow structure and Bragg geometry."],1)
   ],
   6:[
    Q(0,"s6a","Pik konumu değişmeden genişlik artıyorsa doğrudan hangi büyüklük değişmiştir?¦A peak broadens without shifting; which feature directly changed?",["FWHM","2θ merkezi¦2θ centre","Dalga boyu zorunlu değişti¦Wavelength necessarily changed"],0,"Genişlik ve merkez ayrı gözlenebilir özelliklerdir; mikroyapı/cihaz katkılarını inceleyin.¦Width and centre are separate observables; investigate microstructure and instrument effects.",["","Merkez sabit denildi; kayma yok.¦The centre is stated to be fixed.","Broadening does not prove a source-wavelength change.¦Genişlik artışı kaynağın dalga boyunu kanıtlamaz."],0),
    Q(1,"s6a","Williamson–Hall'da βcosθ–4sinθ grafiğinin eğimi ideal modelde nedir?¦In the ideal Williamson–Hall plot βcosθ vs 4sinθ, what is the slope?",["Mikrogerinim ε¦Microstrain ε","Koherent boyut D¦Coherent size D","Dalga boyu λ¦Wavelength λ"],0,"βcosθ=Kλ/D+4εsinθ; x=4sinθ seçildiğinde eğim ε, kesişim Kλ/D olur.¦βcosθ=Kλ/D+4εsinθ; for x=4sinθ slope is ε, intercept Kλ/D.",["","Boyut kesişimden bulunur, eğimden değil.¦Size is associated with the intercept, not the slope.","λ kesişimdeki terimin parçasıdır.¦λ is part of the intercept term."],0),
    Q(2,"s6b","Otomatik XRD analizinde rapordan önce öncelikli kontrol hangisidir?¦Which check should precede an automated XRD report?",["Kalibrasyon ve veri kökeni¦Calibration and data provenance","Yalnız görsel tema¦Only the UI theme","Modelin güven puanını mutlak doğru saymak¦Treat model confidence as certainty"],0,"2θ kalibrasyonu, cihaz profili, ham veri ve kullanılan varsayımlar kayda geçirilmelidir.¦Track 2θ calibration, instrument profile, raw data and modeling assumptions.",["","Görünüm kalite güvencesinin yerini almaz.¦Appearance does not replace scientific QA.","Güven skoru kalibrasyon kanıtı değildir.¦Confidence is not calibration evidence."],0),
    Q(3,"s6d","Search-match sonucu ile Rietveld nicelleştirme aynı işlem midir?¦Is search-match identical to quantitative Rietveld refinement?",["Evet¦Yes","Hayır; aday tanımlama ve tam profil rafinasyonu farklıdır¦No; candidate identification differs from whole-profile refinement","İkisi de yalnız tek pik kullanır¦Both use one peak"],1,"Search-match faz adaylarını bulur; nicel rafinasyon bütün profili, ölçüm etkilerini ve modeli gerektirir.¦Search-match suggests phase candidates; quantitative refinement needs full-profile models and corrections.",["Faz tanıma nicel yüzde doğrulaması değildir.¦Phase identification is not quantitative phase analysis.","","İki yaklaşım da tek pike indirgenmez.¦Neither approach is limited to one peak."],1),
    Q(4,"s6e","ML modeli eğitimde görmediği yeni bir faza yüksek güven verirse ne yapmalı?¦What if an ML model confidently predicts a phase absent from training?",["Sonucu kesin kabul etmek¦Trust it completely","Referans/ölçüm ve belirsizlikle doğrulamak¦Validate with references, data and uncertainty","Kalibrasyonu atlamak¦Skip calibration"],1,"Dağılım dışı tahminler yüksek güvenli ama yanlış olabilir; fizik ve referans karşılaştırması gerekir.¦Out-of-distribution predictions can be confidently wrong; verify against physics and references.",["Güven puanı doğruluk garantisi değildir.¦A confidence score does not guarantee correctness.","","Kalibrasyon daima önemlidir.¦Calibration remains essential."],1),
    Q(3,"s6c","Rietveld uyumu çok düşük Rwp veriyor ama atomik mesafeler fizik dışıysa karar nedir?¦A refinement has low Rwp but impossible bond distances. What should you conclude?",["Modeli sorgulayarak fiziksel kısıtları incelemek¦Question the model and check physical constraints","Rwp düşük diye sonuç kesin doğrudur¦A low Rwp proves correctness","Uymayan atomları sessizce silmek¦Silently remove inconvenient atoms"],0,"İstatistiksel uyum tek başına yapı doğruluğu kanıtı değildir; parametre korelasyonu ve kimyasal geçerlilik kontrol edilmelidir.¦A good numerical fit does not prove structural validity; inspect parameter correlations and chemistry.",["","İyi fit fiziksel tutarlılığın yerini almaz.¦Good fit cannot replace physical plausibility.","Veri/model uyuşmazlığı şeffafça incelenmelidir.¦Discrepancies must be investigated transparently."],1),
   ],
   7:[
    Q(0,"s7a","Birçok pik topluca sağa kayıyor; en güçlü ilk ipucu hangisi?¦Many peaks shift right together; what is the primary clue?",["Konum/ölçüm geometrisi veya örgü parametresi¦Position/geometry or lattice parameter","Yalnız amorf katkı¦Only amorphous content","Sadece kristalit küçülmesi¦Only smaller crystallites"],0,"Sistematik 2θ kaymasında geometri/numune yüksekliği ve a değişimi incelenir; tek başına nedeni kanıtlamaz.¦Systematic 2θ shifts call for checking geometry/sample displacement and a; no single cause is proven.",["","Amorf katkı çoğunlukla geniş zemin üretir.¦Amorphous content typically adds a broad hump.","Small domains primarily broaden peaks.¦Küçük bölgeler esasen piki genişletir."],0),
    Q(1,"s7b","Piklerin yeri sabit ama bazılarının bağıl yüksekliği farklı: ilk olasılık?¦Peak positions stay fixed but relative heights differ. A first possibility?",["Tercihli yönelim¦Preferred orientation","Tüm piklerin tekdüze kayması¦Uniform peak shift","Yeni bir Kα çizgisinin zorunlu oluşması¦A new Kα line necessarily formed"],0,"Doku bazı hkl ailelerini güçlendirip bazılarını zayıflatır; yapı faktörü ve faz karışımı da değerlendirilmelidir.¦Texture favours some hkl families; also assess structure factors and phases.",["","Konum değişmediği için kayma gözlenmedi.¦There is no observed shift in position.","New Kα line is not implied by relative intensities.¦Bağıl şiddet yeni çizgi anlamına gelmez."],0),
    Q(2,"s7b","Geniş ve keskin olmayan bir tümsek hangi ek bileşene işaret edebilir?¦What may a broad diffuse hump suggest?",["Amorf saçılma¦Amorphous scattering","Yalnız HMK (100) pikine¦Only BCC (100) peak","Kesin cihaz hatası¦Definitely instrument failure"],0,"Amorf malzeme geniş difüz saçılma verir; arka plan ve floresansla karşılaştırın.¦Amorphous material gives diffuse scattering; compare background and fluorescence.",["","Sönmüş HMK (100) böyle bir geniş tümsek oluşturmaz.¦Extinct BCC (100) does not create such a hump.","A broad background is not automatically an instrument fault.¦Geniş zemin her zaman cihaz hatası değildir."],0),
    Q(3,"s7c","Tek bir geniş pikten 'kesin küçük parçacık' denebilir mi?¦Can one broad peak prove small particle size?",["Evet¦Yes","Hayır; cihaz, mikrogerinim ve koherent boyut kontrol edilmeli¦No; check instrument, strain and coherent domain size","Yalnız şiddete bakılır¦Use only intensity"],1,"Scherrer D koherent bölgeyi temsil eder; aynı genişlik için cihaz ve gerinim alternatifleri vardır.¦Scherrer D represents coherent domain size; instrument and strain are alternative explanations.",["Genişlik çok nedenli bir gözlemdir.¦Peak width has multiple possible causes.","","Yoğunluk genişleme mekanizmasını tek başına açıklamaz.¦Intensity cannot uniquely explain broadening."],1),
    Q(4,"s7a","İdeal/gerçek karşılaştırmasında kontrol örneği neden yararlı?¦Why is a reference specimen helpful when comparing ideal and real XRD?",["Cihaz/yerleşim etkisini ayırmaya yardım eder¦Helps separate instrumental/placement effects","Numuneyi otomatik amorf yapar¦Makes the sample amorphous","Fizik yasalarını değiştirir¦Changes physical laws"],0,"Referans standart ölçümü, sıfır kayması ve cihaz genişliği gibi etkileri test etmeye yardımcı olur.¦A reference standard helps test zero offset, sample geometry and instrument broadening.",["","Standart numunenin yapısını böyle değiştirmez.¦It does not transform sample structure.","Kalibrasyon fizik yasalarını değiştirmez.¦Calibration does not alter physical laws."],1)
   ]
  };
  var dataset = {goals:chapterGoals,subGoals:subGoals,questions:questions};
  if(typeof module!=="undefined" && module.exports) module.exports={physical:physical,dataset:dataset};
  if(typeof document==="undefined") return;

  function tr(s){return String(s).split("¦")[document.documentElement.lang==="en"?1:0] || String(s).split("¦")[0];}
  function E(tag,cls,txt){ var n=document.createElement(tag);if(cls)n.className=cls;if(txt!=null)n.textContent=tr(txt);return n; }
  function cacheGet(key){try{return JSON.parse(localStorage.getItem(key)||"[]");}catch(e){return [];}}
  function cacheSet(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch(e){}}
  function labelFor(sub){var b=document.querySelector('[data-sub="'+sub+'"]');return b?b.textContent.trim():sub;}
  function drawSurface(cv,paint){
    var width=Math.max(280,cv.getBoundingClientRect().width||560);
    if(cv.closest('[hidden]'))return;
    var height=250,dpi=Math.min(2,window.devicePixelRatio||1);
    cv.width=Math.round(width*dpi);cv.height=Math.round(height*dpi);
    var c=cv.getContext("2d"); if(!c)return;
    c.setTransform(dpi,0,0,dpi,0,0);
    c.clearRect(0,0,width,height);
    var css=getComputedStyle(cv),ink=getComputedStyle(document.documentElement).getPropertyValue("--ink").trim()||"#142030";
    var palette={ink:ink,blue:"#4774ce",teal:"#159a97",red:"#cb5979",orange:"#c88736",pale:"#98a5b7"};
    c.font="13px system-ui, sans-serif";
    paint(c,width,height,palette);
  }
  function title(c,s,x,y,color){c.fillStyle=color;c.fillText(tr(s),x,y);}
  function grid(c,w,h,p){
    c.strokeStyle=p.pale;c.lineWidth=0.8;c.globalAlpha=0.38;
    for(var i=0;i<=4;i++){var y=30+(h-65)*i/4;c.beginPath();c.moveTo(34,y);c.lineTo(w-14,y);c.stroke();}
    c.globalAlpha=1;
  }
  function wave(c,w,h,phase,p){
    grid(c,w,h,p);var base=h*.41,amp=31,from=36,to=w-15;
    [[0,p.blue],[phase,p.orange]].forEach(function(a){
      c.beginPath();for(var i=0;i<=180;i++){var x=from+(to-from)*i/180,y=base-amp*Math.cos(6*PI*i/180-a[0]);if(i===0)c.moveTo(x,y);else c.lineTo(x,y);}
      c.strokeStyle=a[1];c.lineWidth=2;c.stroke();
    });
    c.beginPath();for(var j=0;j<=180;j++){var xx=from+(to-from)*j/180, yy=base+91-amp*(Math.cos(6*PI*j/180)+Math.cos(6*PI*j/180-phase));if(j===0)c.moveTo(xx,yy);else c.lineTo(xx,yy);}
    c.strokeStyle=p.teal;c.lineWidth=3;c.stroke();
    title(c,"E₁",w*.12,17,p.blue);title(c,"E₂",w*.32,17,p.orange);title(c,"E₁+E₂¦E₁+E₂",w*.60,17,p.teal);
  }
  function peak(c,x,center,sigma,height){return height*Math.exp(-.5*Math.pow((x-center)/sigma,2));}
  function lineCurve(c,values,w,h,col,weight){
    var x0=38,y0=24,innerW=w-55,innerH=h-57;
    c.beginPath();for(var i=0;i<values.length;i++){var x=x0+innerW*i/(values.length-1),y=y0+innerH*(1-values[i]);if(i===0)c.moveTo(x,y);else c.lineTo(x,y);}
    c.strokeStyle=col;c.lineWidth=weight||2;c.stroke();
  }
  function renderPhysics(ch,values,cv,output){
    drawSurface(cv,function(c,w,h,p){
      var summary="",lambda=WAVE;
      if(ch===1){
        var hkl=values.hkl.split("").map(Number), d=physical.dCubic(values.a,hkl[0],hkl[1],hkl[2]);
        var gap= Math.max(22,Math.min(53,d/values.a*70));
        var start=110;
        c.save();c.translate(w*.5,h*.52);c.rotate(-.16);
        for(var k=-2;k<=2;k++){c.beginPath();c.moveTo(-w*.34,k*gap);c.lineTo(w*.34,k*gap);c.strokeStyle=p.blue;c.lineWidth=3;c.stroke();}
        c.restore();title(c,"d(hkl) = a / √N",18,20,p.ink);
        summary=tr("Kübik gösterim¦Cubic illustration")+": ("+values.hkl+") · a="+values.a.toFixed(2)+" Å · N="+(hkl.reduce(function(x,y){return x+y*y;},0))+" · d="+d.toFixed(3)+" Å. "+tr("Çizgiler atom düzlemlerini temsil eder; tüm kristal sistemi bu çizimden belirlenemez.¦Lines represent planes; this drawing alone cannot determine crystal symmetry.");
      } else if(ch===2){
        var phase=2*PI*2*values.d*Math.sin(values.theta*RAD)/lambda;
        var norm=physical.phaseIntensity(values.d,values.theta,lambda);
        wave(c,w,h,phase,p);
        summary="λ="+lambda+" Å · d="+values.d.toFixed(2)+" Å · θ="+values.theta.toFixed(1)+"° · Δφ/2π="+(phase/(2*PI)).toFixed(2)+" · I/I₁="+norm.toFixed(2)+". "+tr("İdeal eş genlikli iki katkı; I₁ tek dalganın şiddeti. Tam sayı yol farkı yapıcıdır.¦Ideal equal-amplitude waves; I₁ is single-wave intensity. An integer wavelength path difference is constructive.");
      } else if(ch===3){
        var angle=values.twotheta,rr=24+65*Math.tan(angle*RAD),cy=h/2,cx=w/2,N=values.grains,preferred=values.texture==="texture";
        c.beginPath();c.arc(cx,cy,rr,0,2*PI);c.strokeStyle=p.pale;c.setLineDash([4,4]);c.stroke();c.setLineDash([]);
        for(var j=0;j<N;j++){
          var seed=((j*73)%997)/997,ang=(preferred?(-PI*.2+seed*PI*.4):(2*PI*seed));
          var radius=rr+(j%5-2)*1.8;
          c.beginPath();c.arc(cx+radius*Math.cos(ang),cy+radius*Math.sin(ang),2.6,0,2*PI);c.fillStyle=p.blue;c.fill();
        }
        title(c,"2θ = "+angle.toFixed(0)+"°",15,20,p.ink);
        summary=tr("Öğretim amaçlı azimutal örnekleme¦Illustrative azimuthal sampling")+": "+N+" "+tr("kristalit katkısı¦grain contributions")+". "+tr("Düz dedektörde r=L tan(2θ), 2θ<90° için; çizim ölçekli deneysel sonuç değildir.¦For a flat detector r=L tan(2θ) when 2θ<90°; display is not a scaled experimental result.");
      } else if(ch===4){
        grid(c,w,h,p);
        var peaks=[], type=values.lattice;
        for(var hh=0;hh<=4;hh++)for(var kk=0;kk<=4;kk++)for(var ll=0;ll<=4;ll++){
          var N2=hh*hh+kk*kk+ll*ll;if(!N2||!physical.allowed(type,hh,kk,ll))continue;
          var tt=physical.twoTheta(lambda,values.a/Math.sqrt(N2));
          if(Number.isFinite(tt)&&tt>=15&&tt<=105&&peaks.every(function(x){return Math.abs(x.tt-tt)>.06;}))peaks.push({tt:tt,hkl:""+hh+kk+ll});
        }
        peaks.sort(function(a,b){return a.tt-b.tt;});
        peaks.forEach(function(r,i){var x=35+(w-52)*(r.tt-15)/90,y0=h-36,height=145/(1+i*.18);c.beginPath();c.moveTo(x,y0);c.lineTo(x,y0-height);c.strokeStyle=p.blue;c.lineWidth=2;c.stroke();if(i<6)title(c,r.hkl,x-8,y0-height-7,p.ink);});
        title(c,"2θ (°)",w-66,h-8,p.ink);
        summary=type+" · a="+values.a.toFixed(2)+" Å · "+peaks.length+" "+tr("benzersiz çizgi (15–105°)¦unique sticks (15–105°)")+". "+tr("Yalnız geometrik konumlar ve merkezleme seçimi; çubuk yükseklikleri gerçek şiddet değildir.¦Positions and centering selection only; stick heights are not physical intensities.");
      } else if(ch===5){
        grid(c,w,h,p);
        var arr=values.hkl.split("").map(Number), a=physical.cubicA(lambda,values.twotheta,arr[0],arr[1],arr[2]);
        var dCalc=lambda/(2*Math.sin(values.twotheta*RAD/2));
        var x5=35+(w-53)*(values.twotheta-20)/70;
        c.fillStyle=p.blue;c.fillRect(x5-2,32,4,h-68);
        title(c,"(hkl)=("+values.hkl+")",18,19,p.ink);
        title(c,"2θ="+values.twotheta.toFixed(1)+"°",x5+8,48,p.ink);
        summary="λ="+lambda+" Å · 2θ="+values.twotheta.toFixed(1)+"° · θ="+(values.twotheta/2).toFixed(1)+"° · d="+dCalc.toFixed(3)+" Å · a="+a.toFixed(3)+" Å. "+tr("Kübik geometri; hkl seçiminde sönüm ve çoklu pik tutarlılığı ayrıca incelenir.¦Cubic geometry; also check extinction and consistency across peaks.");
      } else if(ch===6){
        grid(c,w,h,p);
        var beta=physical.whDegrees(values.size,values.strain,values.theta);
        c.beginPath();var axisY=h-40;
        var c0=(0.9*lambda/(values.size*10)), eps=values.strain, maxY=Math.max(.004,c0+3.6*eps)*1.1;
        for(var x6=0;x6<=100;x6++){var xx=35+(w-53)*x6/100, xxparam=3.6*x6/100, val=c0+eps*xxparam,yy=axisY-(val/maxY)*(h-87);if(x6===0)c.moveTo(xx,yy);else c.lineTo(xx,yy);}
        c.strokeStyle=p.orange;c.lineWidth=3;c.stroke();
        title(c,"β cosθ = Kλ/D + 4εsinθ",17,19,p.ink);
        title(c,tr("x=4sinθ · eğim=ε¦x=4sinθ · slope=ε"),w*.53,h-13,p.orange);
        summary="D="+values.size.toFixed(0)+" nm · ε="+values.strain.toFixed(4)+" · θ="+values.theta.toFixed(0)+"° · β≈"+beta.toFixed(3)+"°. "+tr("Lorentz türü toplanabilir genişlik yaklaşımı; cihaz katkısı ve birim/radyan dönüşümü deneyde ayrıca gerekir.¦Simplified additive Lorentzian broadening; instrumental width and radian conversion must be handled for real measurements.");
      } else if(ch===7){
        grid(c,w,h,p);var n=210,base=[],changed=[];
        for(var ii=0;ii<n;ii++){
          var xx7=28+60*ii/(n-1), ideal=peak(c,xx7,38,0.55,.84)+peak(c,xx7,52,.75,.63)+peak(c,xx7,72,1.0,.9);
          var mode=values.effect, shift=mode==="shift"?1.8:0, sg=mode==="width"?1.9:1;
          var actual=peak(c,xx7,38+shift,.55*sg,.84*(mode==="texture"?.44:1))
          +peak(c,xx7,52+shift,.75*sg,.63*(mode==="texture"?1.5:1))
          +peak(c,xx7,72+shift,1*sg,.9);
          if(mode==="amorphous")actual+=peak(c,xx7,57,7,.3);
          if(mode==="noise")actual+=.07*(Math.sin(ii*27.4)+Math.sin(ii*8.71));
          base.push(Math.max(0,Math.min(1,ideal)));changed.push(Math.max(0,Math.min(1,actual)));
        }
        lineCurve(c,base,w,h,p.pale,2);lineCurve(c,changed,w,h,p.blue,2.4);
        title(c,tr("Gri: ideal¦Grey: ideal"),16,18,p.pale);title(c,tr("Mavi: değişmiş¦Blue: altered"),w*.40,18,p.blue);
        var words={shift:"Pik konumu kayıyor¦Peak positions shift",width:"Pikler genişliyor¦Peaks broaden",texture:"Bağıl şiddetler değişiyor¦Relative intensities change",amorphous:"Geniş amorf tümsek¦Broad diffuse hump",noise:"Sayım gürültüsü¦Counting noise"};
        summary=tr(words[values.effect])+". "+tr("Öğretim amaçlı biçim modeli; tek bir iz tek başına kesin tanı değildir.¦Illustrative profile model; one signature alone does not prove a unique cause.");
      }
      output.textContent=summary;
    });
  }
  var configs={
    1:{controls:[["a","a (Å)","range",3,7,.1,4.0],["hkl","(hkl)","select",["100","110","111","200"]]]},
    2:{controls:[["d","d (Å)","range",1.3,4,.05,2.4],["theta","θ (°)","range",10,70,1,30]]},
    3:{controls:[["grains","Kristalit sayısı¦Number of grains","range",12,280,4,72],["twotheta","2θ (°)","range",20,65,1,42],["texture","Yönelim¦Orientation","select",[["random","Rastgele¦Random"],["texture","Tercihli¦Textured"]]]]},
    4:{controls:[["lattice","Örgü¦Lattice","select",[["P","İlkel (P)¦Primitive (P)"],["I","HMK (I)¦BCC (I)"],["F","YMK (F)¦FCC (F)"]]],["a","a (Å)","range",3,6,.1,4]]},
    5:{controls:[["twotheta","Ölçülen 2θ (°)¦Measured 2θ (°)","range",30,80,.5,45],["hkl","(hkl)","select",["100","110","111","200"]]]},
    6:{controls:[["size","D (nm)","range",20,140,5,55],["strain","ε","range",0,.004,.0002,.001],["theta","θ (°)","range",10,65,1,35]]},
    7:{controls:[["effect","Etki¦Effect","select",[["shift","Konum kayması¦Position shift"],["width","Pik genişliği¦Broadening"],["texture","Tercihli yönelim¦Texture"],["amorphous","Amorf katkı¦Amorphous contribution"],["noise","Gürültü¦Noise"]]]]}
  };
  function makeControls(ch,area,changed){
    var state={}, config=configs[ch].controls;
    config.forEach(function(z){
      var name=z[0],wrap=E("label","xrd-game-control"),text=E("span","",z[1]), input,readout=E("output","xrd-game-value");
      if(z[2]==="range"){
        input=E("input");input.type="range";input.min=z[3];input.max=z[4];input.step=z[5];input.value=z[6];state[name]=Number(z[6]);
        readout.textContent=Number(z[6]).toFixed(z[5]<.001?4:z[5]<1?2:0);
      } else {
        input=E("select");z[3].forEach(function(item){var opt=E("option");opt.value=Array.isArray(item)?item[0]:item;opt.textContent=tr(Array.isArray(item)?item[1]:item);input.appendChild(opt);});
        state[name]=input.value;readout.hidden=true;
      }
      input.setAttribute("aria-label",tr(z[1]));
      function update(){state[name]=z[2]==="range"?Number(input.value):input.value;if(z[2]==="range")readout.textContent=Number(state[name]).toFixed(z[5]<.001?4:z[5]<1?2:0);changed();}
      input.addEventListener("input",update);input.addEventListener("change",update);
      wrap.append(text,input,readout);area.append(wrap);
    });
    return state;
  }
  function installOutcomes(){
    Object.keys(subGoals).forEach(function(id){
      var sp=document.getElementById(id);if(!sp||sp.querySelector(":scope > .learn-box"))return;
      var box=E("div","learn-box xrd-subgoals"),head=E("b","", "Bu alt başlığın kazanımları¦Learning outcomes for this subsection"),ul=E("ul");
      subGoals[id].forEach(function(g){ul.appendChild(E("li","",g));});box.append(head,ul);sp.append(box);
    });
    document.querySelectorAll(".subp").forEach(function(sp){
      var old=sp.querySelector(":scope > .learn-box");if(!old)return;
      var quiz=sp.querySelector(":scope > .quiz");
      if(quiz)sp.insertBefore(old,quiz);else sp.append(old);
      var ch=Number(sp.id.charAt(1)),target="s"+ch+"game";
      if(!Number.isInteger(ch)||ch<1||ch>7)return;
      var button=E("button","xrd-go-game","Bu kazanımları oyunlarla pekiştir →¦Practise these outcomes with games →");
      button.type="button";button.addEventListener("click",function(){var t=document.querySelector('[data-sub="'+target+'"]');if(t)t.click();});
      old.appendChild(button);
    });
  }
  var gameStates={};
  function buildGame(ch){
    var section=document.getElementById("t"+ch),nav=section&&section.querySelector(":scope > .subnav");
    if(!nav)return;
    var subId="s"+ch+"game",b=E("button","xrd-game-tab","Oyunlar¦Games");
    b.type="button";b.setAttribute("role","tab");b.dataset.sub=subId;b.setAttribute("aria-controls",subId);b.setAttribute("aria-selected","false");b.tabIndex=-1;
    b.id="xrdgame-tab-"+ch;nav.append(b);
    var panel=E("div","subp xrd-games"),titleNode=E("h3","", "Kazanım ve oyun laboratuvarı¦Learning outcomes and game lab");
    panel.id=subId;panel.hidden=true;panel.setAttribute("role","tabpanel");panel.setAttribute("aria-labelledby",b.id);
    var intro=E("p","xrd-game-intro","Önce değişkenleri keşfet, sonra tahminini seç. Her yanıt kavramı, nedeni ve ilgili anlatım sekmesini gösterir.¦Explore the variables, then choose a prediction. Every answer explains the concept, reason and linked lesson.");
    var goals=E("ol","xrd-chapter-goals"),goalEntries=[];
    chapterGoals[ch].forEach(function(g,i){var item=E("li","");var marker=E("span","xrd-goal-marker","○");item.append(marker,document.createTextNode(tr(g)));goals.append(item);goalEntries.push({item:item,marker:marker});});
    var modeBar=E("div","xrd-game-modes"),modeBtns=[];
    ["Oyun 1 · Keşfet ve tahmin et¦Game 1 · Explore and predict","Oyun 2 · Yorumla ve karar ver¦Game 2 · Interpret and decide"].forEach(function(x,i){
      var m=E("button","",x);m.type="button";m.addEventListener("click",function(){changeMode(i);});modeBar.append(m);modeBtns.push(m);
    });
    var model=E("section","panel xrd-game-model"),modelTitle=E("h4","", "Canlı fizik modeli¦Live physics model");
    var controls=E("div","xrd-game-controls"),cv=E("canvas","xrd-game-canvas");
    cv.setAttribute("role","img");cv.setAttribute("aria-label",tr("Konuya göre değişen fizik modeli grafiği¦Interactive physics model plot"));
    var output=E("p","xrd-game-output");model.append(modelTitle,controls,cv,output);
    var play=E("section","panel xrd-game-quest"),counter=E("p","xrd-quest-count"),question=E("h4","xrd-quest-question");
    var answers=E("div","xrd-quest-answers"),fb=E("div","xrd-game-feedback"),bottom=E("div","xrd-quest-bottom");
    fb.setAttribute("role","status");fb.setAttribute("aria-live","polite");fb.hidden=true;
    var next=E("button","primary","Sonraki görev →¦Next challenge →");next.type="button";next.disabled=true;
    var history=E("span","xrd-quest-history");
    bottom.append(history,next);play.append(counter,question,answers,fb,bottom);
    panel.append(titleNode,intro,goals,modeBar,model,play);section.append(panel);
    var vals=makeControls(ch,controls,function(){renderPhysics(ch,vals,cv,output);});
    var saved=cacheGet("xrd-game-complete-"+ch),completed=new Set(saved),mode=0,index=[0,0],attempted={};
    gameStates[ch]={complete:completed,mode:mode,index:index,questions:questions[ch]};
    function refreshGoalStatus(){
      goalEntries.forEach(function(item,i){var qs=questions[ch].filter(function(q){return q.g===i;});
        var ok=qs.every(function(q){return completed.has(questions[ch].indexOf(q));});
        item.marker.textContent=ok?"✓":"○";item.item.classList.toggle("xrd-goal-done",ok);
      });
      history.textContent=completed.size+" / "+questions[ch].length+" "+tr("kazanım görevi tamamlandı¦outcome challenges completed");
    }
    function lessonButton(sub){
      var go=E("button","xrd-lesson-link",tr("Anlatıma dön: ¦Back to lesson: ")+labelFor(sub));
      go.type="button";go.addEventListener("click",function(){var navB=section.querySelector('[data-sub="'+sub+'"]');if(navB)navB.click();});
      return go;
    }
    function showFeedback(q,choice,correct,idx){
      var message=correct?tr("Doğru! Kavramı doğru ilişkilendirdin.¦Correct! You connected the ideas correctly."):tr("İyi bir deneme. Bu seçenekteki yanılgıyı birlikte düzeltelim.¦Good attempt. Let's address the misconception in this choice.");
      fb.hidden=false;fb.replaceChildren();fb.className="xrd-game-feedback "+(correct?"is-correct":"is-wrong");
      fb.append(E("strong","",message));
      if(!correct){
        fb.append(E("p","",q.errors[choice]||tr("Bu yorum fiziksel bağıntıyla uyuşmuyor.¦This interpretation does not follow the physical relation.")));
        fb.append(E("p","",tr("Doğru seçenek: ¦Correct option: ")+tr(q.choices[q.answer])));
      }
      fb.append(E("p","",tr(q.why)),lessonButton(q.sub));
      if(correct){
        completed.add(idx);cacheSet("xrd-game-complete-"+ch,Array.from(completed));next.disabled=false;
      } else {next.disabled=true;}
      refreshGoalStatus();
    }
    function renderQuestion(){
      var list=questions[ch].map(function(q,i){return {q:q,i:i};}).filter(function(item){return item.q.mode===mode;});
      var entry=list[index[mode]%list.length],q=entry.q;
      counter.textContent=tr("Görev ¦Challenge ")+(index[mode]+1)+" / "+list.length+" · "+tr("İlgili kazanım ¦Outcome ")+(q.g+1);
      question.textContent=tr(q.ask);answers.replaceChildren();fb.hidden=true;fb.replaceChildren();next.disabled=true;
      q.choices.forEach(function(choice,j){
        var opt=E("button","xrd-game-choice",String.fromCharCode(65+j)+". "+tr(choice));opt.type="button";
        opt.addEventListener("click",function(){
          var key=String(entry.i),before=attempted[key]===true;
          attempted[key]=true;
          var correct=j===q.answer;
          answers.querySelectorAll("button").forEach(function(x,k){x.classList.toggle("is-answer",k===q.answer&&correct);x.classList.toggle("is-miss",k===j&&!correct);});
          showFeedback(q,j,correct,entry.i);
        });
        answers.append(opt);
      });
      refreshGoalStatus();
    }
    function changeMode(newMode){
      mode=newMode;gameStates[ch].mode=mode;
      modeBtns.forEach(function(x,i){x.classList.toggle("active",i===mode);x.setAttribute("aria-pressed",String(i===mode));});
      renderQuestion();requestAnimationFrame(function(){renderPhysics(ch,vals,cv,output);});
    }
    next.addEventListener("click",function(){var num=questions[ch].filter(function(q){return q.mode===mode;}).length;index[mode]=(index[mode]+1)%num;renderQuestion();});
    function showGame(scroll){
      nav.querySelectorAll('[role="tab"]').forEach(function(x){var on=x===b;x.setAttribute("aria-selected",String(on));x.tabIndex=on?0:-1;});
      section.querySelectorAll(":scope > .subp").forEach(function(p){p.hidden=p!==panel;});
      try{localStorage.setItem("xrd-sub-t"+ch,subId);}catch(e){}
      renderQuestion();requestAnimationFrame(function(){renderPhysics(ch,vals,cv,output);if(scroll)panel.scrollIntoView({behavior:"smooth",block:"start"});});
    }
    b.addEventListener("click",function(){showGame(true);});
    // Existing navigation handlers predate this dynamically added panel.
    nav.addEventListener("click",function(event){
      var clicked=event.target.closest('[role="tab"]');
      if(clicked&&clicked!==b)panel.hidden=true;
    });
    nav.addEventListener("keydown",function(e){
      if(e.key!=="ArrowRight"&&e.key!=="ArrowLeft")return;
      var buttons=Array.from(nav.querySelectorAll('[role="tab"]')),at=buttons.indexOf(e.target);
      if(at<0)return;
      e.preventDefault();e.stopImmediatePropagation();
      var target=buttons[(at+(e.key==="ArrowRight"?1:-1)+buttons.length)%buttons.length];target.focus();target.click();
    },true);
    changeMode(0);
    try{if(localStorage.getItem("xrd-sub-t"+ch)===subId)showGame(false);}catch(e){}
  }
  installOutcomes();
  for(var c=1;c<=7;c++)buildGame(c);
  window.addEventListener("resize",function(){Object.keys(gameStates).forEach(function(k){
    var panel=document.getElementById("s"+k+"game");if(panel&&!panel.hidden){
      var cv=panel.querySelector(".xrd-game-canvas"),out=panel.querySelector(".xrd-game-output");
      var ctrl=panel.querySelector(".xrd-game-controls"),state={};
      configs[k].controls.forEach(function(z){var el=ctrl.querySelector('[aria-label="'+tr(z[1])+'"]');if(el)state[z[0]]=z[2]==="range"?Number(el.value):el.value;});
      renderPhysics(Number(k),state,cv,out);
    }
  });},{passive:true});
  root.XRDLearning={physical:physical,dataset:dataset,gameStates:gameStates};
})(typeof window!=="undefined"?window:this);
