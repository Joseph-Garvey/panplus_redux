/**
 * @file Processor to process TS files. Code is included here as they are needed (this code is called from a worker).
 */
VADProcessor = (() => {
    //constants
    const HAMMING_WINDOW_MULTIPLIER_512 = [0.29146093930065575,0.2867296278678866,0.28203645802155886,0.27738213653578864,0.2727673643342717,0.2681928363847271,0.26365924159423765,0.2591672627055029,0.25471757619402075,0.2503108521662125,0.24594775425850762,0.24162893953740228,0.23735505840050758,0.23312675447860215,0.22894466453870377,0.2248094183881743,0.2207216387798736,0.2166819413183746,0.21269093436725567,0.20874921895748366,0.20485738869690057,0.20101602968082827,0.19722572040380504,0.19348703167246617,0.18980052651958246,0.18616676011927002,0.18258627970338265,0.17905962447910106,0.17558732554772982,0.17216990582471592,0.16880787996089935,0.1655017542650088,0.16225202662741317,0.15905918644514117,0.1559237145481801,0.15284608312706444,0.14982675566176584,0.14686618685189462,0.14396482254822368,0.1411230996855451,0.13834144621686928,0.13562028104897694,0.13296001397933316,0.13036104563437334,0.1278237674091705,0.12534856140849254,0.12293580038925855,0.12058584770440323,0.11829905724815715,0.11607577340275155,0.11391633098655563,0.11182105520365421,0.10979026159487315,0.10782425599026019,0.10592333446302771,0.10408778328496571,0.10231787888332977,0.10061388779921271,0.09897606664740388,0.09740466207774451,0.09589991073798254,0.09446203923813501,0.09309126411636076,0.091787791806351,0.09055181860624123,0.08938353064904897,0.08828310387464333,0.0872507040032488,0.08628648651048865,0.08539059660397058,0.0845631692014191,0.08380432891035755,0.08311419000934261,0.0824928564307541,0.08194042174514365,0.08145696914714279,0.08104257144293459,0.08069729103928891,0.08042117993416464,0.08021427970887851,0.08007662152184347,0.08000822610387603,0.08000910375507464,0.08007925434326829,0.08021866730403632,0.08042732164229976,0.08070518593548265,0.08105221833824461,0.0814683665887822,0.08195356801669962,0.08250774955244655,0.08313082773832209,0.08382270874104336,0.08458328836587631,0.08541245207232706,0.08631007499139126,0.08727602194435907,0.08831014746317234,0.0894122958123319,0.09058230101235026,0.09181998686474796,0.09312516697858814,0.0944976447985465,0.09593721363451174,0.09744365669271243,0.09901674710836494,0.10065624797983913,0.10236191240433412,0.10413348351506163,0.1059706945199288,0.10787326874171599,0.10984091965974369,0.11187335095302109,0.11397025654487142,0.11613132064902554,0.11835621781717842,0.12064461298800022,0.12299616153759574,0.12541050933140302,0.12788729277752497,0.13042613888148502,0.13302666530239843,0.1356884804105517,0.13841118334638053,0.14119436408083758,0.14403760347714167,0.14694047335389798,0.14990253654958063,0.15292334698836763,0.1560024497473183,0.15913938112488313,0.16233366871073512,0.16558483145691322,0.16889237975026672,0.17225581548618873,0.1756746321436291,0.17914831486137467,0.18267634051558523,0.18625817779857445,0.18989328729882254,0.19358112158220964,0.19732112527445778,0.20111273514476763,0.2049553801906393,0.20884848172386333,0.2127914534576687,0.2167837015950157,0.22082462491801957,0.22491361487849149,0.22905005568958386,0.23323332441852557,0.23746279108043333,0.24173781873318512,0.2460577635733412,0.25042197503309854,0.25482979587826426,0.2592805623072322,0.26377360405094946,0.2683082444738562,0.27288380067578427,0.2774995835948,0.28215489811097383,0.2868490431510634,0.291581311794092,0.29635099137780874,0.3011573636060124,0.3059997046567249,0.31087728529119524,0.31578937096372117,0.3207352219322684,0.3257140933698734,0.3307252354768114,0.3357678935935135,0.34084130831421566,0.3459447156013225,0.3510773469004683,0.3562384292562588,0.36142718542867536,0.36664283401012365,0.3718845895431123,0.37715166263853867,0.3824432600945684,0.3877585850160887,0.3930968369347176,0.3984572119293518,0.4038389027472342,0.40924109892552296,0.4146629869133447,0.42010375019431134,0.4255625694094856,0.4310386224807729,0.43653108473472313,0.4420391290267237,0.44756192586556454,0.453098643538356,0.4586484482357822,0.4642105041776697,0.4697839737388523,0.4753680175753152,0.4809617947505959,0.48656446286242766,0.49217517816960094,0.4977930957190283,0.5034173694729913,0.5090471524365501,0.5146815967850984,0.5203198539920425,0.5259610749565862,0.5316044101316023,0.5372490096515711,0.5428940234605673,0.5485386014402754,0.5541818935380142,0.5598230498947511,0.5654612209730888,0.5710955576852017,0.5767252115207057,0.5823493346744406,0.5879670801741467,0.5935776020080155,0.5991800552520955,0.604773596197536,0.6103573824776451,0.6159305731947479,0.6214923290468222,0.6270418124538943,0.6325781876841758,0.6381006209799215,0.64360828068299,0.6491003373600889,0.654575963927684,0.6600343357765551,0.6654746308959791,0.6708960299975222,0.6762977166384212,0.6816788773445367,0.6870387017328601,0.6923763826335533,0.6976911162115063,0.7029821020873913,0.7082485434581973,0.7134896472172254,0.7187046240735275,0.7238926886707715,0.729053059705512,0.7341849600448527,0.7392876168434791,0.7443602616600463,0.7494021305729036,0.7544124642951382,0.7593905082889211,0.7643355128791374,0.7692467333662849,0.7741234301386232,0.7789648687835562,0.7837703201982322,0.7885390606993443,0.7932703721321135,0.7979635419784412,0.8026178634642114,0.8072326356657282,0.8118071636152728,0.8163407584057625,0.8208327372944972,0.8252824238059793,0.8296891478337876,0.8340522457414924,0.8383710604625978,0.8426449415994925,0.8468732455213979,0.8510553354612962,0.8551905816118256,0.8592783612201265,0.8633180586816256,0.8673090656327445,0.8712507810425164,0.8751426113030996,0.8789839703191717,0.882774279596195,0.8865129683275339,0.8901994734804175,0.8938332398807299,0.8974137202966173,0.900940375520899,0.9044126744522702,0.9078300941752842,0.9111921200391007,0.9144982457349913,0.9177479733725868,0.9209408135548589,0.9240762854518199,0.9271539168729356,0.9301732443382341,0.9331338131481054,0.9360351774517764,0.938876900314455,0.9416585537831308,0.944379718951023,0.9470399860206669,0.9496389543656267,0.9521762325908295,0.9546514385915075,0.9570641996107414,0.9594141522955968,0.9617009427518428,0.9639242265972485,0.9660836690134444,0.9681789447963458,0.9702097384051269,0.9721757440097398,0.9740766655369724,0.9759122167150344,0.9776821211166702,0.9793861122007873,0.9810239333525961,0.9825953379222556,0.9841000892620175,0.9855379607618651,0.9869087358836393,0.9882122081936491,0.9894481813937588,0.9906164693509512,0.9917168961253567,0.9927492959967512,0.9937135134895114,0.9946094033960295,0.995436830798581,0.9961956710896425,0.9968858099906575,0.997507143569246,0.9980595782548565,0.9985430308528573,0.9989574285570655,0.9993027089607112,0.9995788200658354,0.9997857202911216,0.9999233784781566,0.999991773896124,0.9999908962449254,0.9999207456567318,0.9997813326959637,0.9995726783577004,0.9992948140645175,0.9989477816617555,0.9985316334112179,0.9980464319833005,0.9974922504475535,0.996869172261678,0.9961772912589567,0.9954167116341237,0.9945875479276731,0.9936899250086089,0.992723978055641,0.9916898525368277,0.9905877041876682,0.9894176989876499,0.9881800131352521,0.986874833021412,0.9855023552014536,0.9840627863654883,0.9825563433072877,0.9809832528916351,0.979343752020161,0.9776380875956658,0.9758665164849385,0.9740293054800713,0.9721267312582842,0.9701590803402564,0.9681266490469791,0.9660297434551286,0.9638686793509746,0.9616437821828216,0.959355387012,0.9570038384624043,0.954589490668597,0.9521127072224751,0.949573861118515,0.9469733346976017,0.9443115195894484,0.9415888166536197,0.9388056359191624,0.9359623965228585,0.9330595266461021,0.9300974634504195,0.9270766530116326,0.9239975502526816,0.9208606188751169,0.917666331289265,0.914415168543087,0.9111076202497334,0.9077441845138114,0.904325367856371,0.9008516851386256,0.897323659484415,0.8937418222014257,0.8901067127011776,0.8864188784177903,0.8826788747255423,0.8788872648552324,0.8750446198093609,0.8711515182761367,0.8672085465423315,0.8632162984049843,0.8591753750819806,0.8550863851215087,0.8509499443104165,0.8467666755814746,0.8425372089195666,0.838262181266815,0.8339422364266589,0.8295780249669016,0.8251702041217357,0.820719437692768,0.8162263959490506,0.811691755526144,0.8071161993242159,0.8025004164052,0.7978451018890262,0.7931509568489366,0.7884186882059081,0.7836490086221912,0.7788426363939878,0.7740002953432752,0.7691227147088051,0.764210629036279,0.759264778067732,0.7542859066301267,0.7492747645231885,0.7442321064064866,0.7391586916857843,0.7340552843986776,0.7289226530995316,0.7237615707437413,0.7185728145713248,0.7133571659898766,0.7081154104568879,0.7028483373614616,0.6975567399054317,0.6922414149839112,0.6869031630652825,0.6815427880706482,0.676161097252766,0.670758901074477,0.6653370130866556,0.6598962498056888,0.6544374305905147,0.6489613775192272,0.6434689152652772,0.6379608709732764,0.6324380741344354,0.6269013564616441,0.6213515517642176,0.6157894958223304,0.6102160262611476,0.6046319824246851,0.5990382052494042,0.5934355371375727,0.5878248218303992,0.582206904280972,0.5765826305270089,0.5709528475634499,0.5653184032149017,0.5596801460079575,0.554038925043414,0.5483955898683979,0.5427509903484293,0.5371059765394328,0.5314613985597249,0.525818106461986,0.5201769501052492,0.5145387790269113,0.5089044423147981,0.5032747884792944,0.4976506653255593,0.4920329198258535,0.4864223979919847,0.48081994474790485,0.47522640380246417,0.46964261752235525,0.4640694268052522,0.4585076709531782,0.45295818754610584,0.44742181231582406,0.44189937902007864,0.43639171931700993,0.43089966263991125,0.42542403607231605,0.4199656642234452,0.41452536910402094,0.4091039700024781,0.403702283361579,0.3983211226554632,0.3929612982671401,0.3876236173664467,0.38230888378849387,0.37701789791260865,0.37175145654180286,0.36651035278277466,0.36129537592647276,0.3561073113292287,0.3509469402944883,0.3458150399551474,0.34071238315652086,0.33563973833995386,0.33059786942709635,0.3255875357048619,0.3206094917110789,0.31566448712086287,0.3107532666337152,0.3058765698613771,0.3010351312164439,0.29622967980176795];
    const LINE_COEFFS = {"jReciprocal":[0,1,0.5,0.3333333333333333,0.25,0.2,0.16666666666666666,0.14285714285714285,0.125,0.1111111111111111,0.1,0.09090909090909091,0.08333333333333333,0.07692307692307693,0.07142857142857142,0.06666666666666667,0.0625,0.058823529411764705,0.05555555555555555,0.05263157894736842,0.05,0.047619047619047616,0.045454545454545456,0.043478260869565216,0.041666666666666664,0.04,0.038461538461538464,0.037037037037037035,0.03571428571428571,0.034482758620689655,0.03333333333333333,0.03225806451612903,0.03125,0.030303030303030304,0.029411764705882353,0.02857142857142857,0.027777777777777776,0.02702702702702703,0.02631578947368421,0.02564102564102564,0.025,0.024390243902439025,0.023809523809523808,0.023255813953488372,0.022727272727272728,0.022222222222222223,0.021739130434782608,0.02127659574468085,0.020833333333333332,0.02040816326530612,0.02,0.0196078431372549,0.019230769230769232,0.018867924528301886,0.018518518518518517,0.01818181818181818,0.017857142857142856,0.017543859649122806,0.017241379310344827,0.01694915254237288,0.016666666666666666,0.01639344262295082,0.016129032258064516,0.015873015873015872,0.015625,0.015384615384615385,0.015151515151515152,0.014925373134328358,0.014705882352941176,0.014492753623188406,0.014285714285714285,0.014084507042253521,0.013888888888888888,0.0136986301369863,0.013513513513513514,0.013333333333333334,0.013157894736842105,0.012987012987012988,0.01282051282051282,0.012658227848101266,0.0125],"log2jOverj":[0,0,0.5,0.5283208335737187,0.5,0.46438561897747244,0.430827083453526,0.4010507031510863,0.375,0.3522138890491458,0.3321928094887362,0.3144937835124816,0.29874687506009634,0.2846492090877763,0.2719539230041146,0.26045937304056793,0.25,0.24043899066178465,0.23166250008012845,0.2235751322865045,0.21609640474436814,0.2091579725132743,0.20270143721078623,0.19667660678508753,0.19104010419671483,0.18575424759098896,0.1807861430054266,0.1761069445245729,0.171691247216343,0.16751658603888178,0.1635630198536173,0.15981278420602824,0.15625,0.15286042785934706,0.14963126003677468,0.14655094334128474,0.14360902781784202,0.14079603690889053,0.13810335561693646,0.13552313381698072,0.13304820237218407,0.1306720001126362,0.12838851006616098,0.1261922035977232,0.12407799133266585,0.12204117991843721,0.12007743382732637,0.11818274152505612,0.11635338543169076,0.11458591518602466,0.11287712379549449,0.11122402631316657,0.10962384073348254,0.10807397084081508,0.10657199078080497,0.10511563115499381,0.10370276646531436,0.10233140375727616,0.10099967232978573,0.09970581439596342,0.09844817659347531,0.09722520225512929,0.09603542436107863,0.09487745910317329,0.09375,0.09265181250813007,0.09158172908118868,0.0905386446336981,0.08952151237132852,0.0885293399533068,0.08756118595635666,0.08661615661274201,0.08569340279780989,0.08479211724493174,0.08391153196795878,0.08305091587327841,0.08220957254531033,0.08138683819084287,0.08058207972900319,0.07979469301490004,0.07902410118609203],"log2jSqOverj":[0,0,0.5,0.8373687095640868,1,1.078270015565451,1.1136718550224287,1.1258916654858653,1.125,1.1164916127521158,1.103520626760198,1.0879697385479519,1.0709963442980739,1.053327239045856,1.0354251073225904,1.0175862750702858,1,0.9827854399177821,0.9660152509807592,0.9497309557616316,0.9339531228688355,0.918688206783136,0.9039331982410029,0.8896788160994065,0.8759117138757998,0.8626160124523607,0.8497743670722426,0.8373687095640868,0.8253807623796954,0.8137923913455405,0.8025858439090442,0.7917439058661588,0.78125,0.7710882433763074,0.761243475326558,0.7517012647977159,0.7424479033482858,0.7334703883422378,0.7247563996410045,0.7162942721834354,0.7080729661787858,0.7000820361509086,0.6923115997143661,0.6847523067005167,0.6773953090585605,0.6702322318147964,0.6632551452695734,0.6564565385357766,0.6498292944679481,0.6433666659919229,0.6370622538171694,0.6309099854949105,0.6249040957723171,0.6190391081849713,0.6133098178251349,0.6077112752211988,0.6022387712633336,0.5968878231112764,0.5916541610219969,0.586533716037376,0.5815226084748061,0.5766171371665986,0.5718137693971721,0.5671091314900821,0.5625,0.5579832934677097,0.553556064699016,0.5492154935311735,0.5449588800529949,0.5407836382472033,0.5366872900258569,0.5326674596317765,0.5287218683808739,0.5248483297221124,0.5210447445935229,0.5173090970542775,0.5136394501742808,0.5100339421640878,0.5064907827292112,0.5030082496340288,0.49958468546157697]}
    const SUMMED_COEFFS = {"jReciprocal":[0,1,1.5,1.8333333333333333,2.083333333333333,2.283333333333333,2.4499999999999997,2.5928571428571425,2.7178571428571425,2.8289682539682537,2.9289682539682538,3.0198773448773446,3.103210678210678,3.180133755133755,3.251562326562327,3.3182289932289937,3.3807289932289937,3.439552522640758,3.4951080781963135,3.547739657143682,3.597739657143682,3.6453587047627294,3.690813250217275,3.73429151108684,3.7759581777535067,3.8159581777535068,3.854419716215045,3.8914567532520823,3.927171038966368,3.9616537975870574,3.9949871309203906,4.02724519543652,4.05849519543652,4.08879822573955,4.118209990445433,4.146781419016861,4.174559196794639,4.201586223821666,4.22790201329535,4.2535430389363755,4.278543038936376,4.302933282838815,4.326742806648339,4.349998620601827,4.3727258933290996,4.394948115551322,4.416687245986104,4.4379638417307845,4.4587971750641175,4.4792053383294235,4.499205338329423,4.518813181466678,4.538043950697447,4.556911875225749,4.575430393744267,4.593612211926086,4.611469354783229,4.6290132144323515,4.646254593742697,4.6632037462850695,4.679870412951736,4.696263855574687,4.712392887832752,4.7282659037057675,4.7438909037057675,4.759275519090383,4.774427034241898,4.789352407376227,4.804058289729168,4.818551043352357,4.832836757638071,4.846921264680325,4.860810153569214,4.8745087837062,4.888022297219713,4.901355630553047,4.914513525289889,4.927500538276902,4.940321051097415,4.9529792789455165,4.965479278945517],"log2jOverj":[0,0,0.5,1.0283208335737188,1.5283208335737188,1.9927064525511913,2.4235335360047174,2.824584239155804,3.199584239155804,3.5517981282049496,3.8839909376936856,4.198484721206167,4.497231596266264,4.7818808053540405,5.053834728358155,5.3142941013987235,5.5642941013987235,5.804733092060508,6.036395592140637,6.259970724427141,6.4760671291715095,6.685225101684784,6.88792653889557,7.084603145680657,7.275643249877372,7.461397497468361,7.642183640473787,7.81829058499836,7.989981832214703,8.157498418253585,8.321061438107202,8.480874222313231,8.637124222313231,8.789984650172578,8.939615910209353,9.086166853550639,9.22977588136848,9.37057191827737,9.508675273894307,9.644198407711288,9.777246610083472,9.907918610196107,10.036307120262268,10.162499323859992,10.286577315192657,10.408618495111094,10.52869592893842,10.646878670463476,10.763232055895166,10.87781797108119,10.990695094876685,11.101919121189852,11.211542961923334,11.319616932764148,11.426188923544954,11.531304554699949,11.635007321165263,11.73733872492254,11.838338397252326,11.93804421164829,12.036492388241765,12.133717590496895,12.229753014857973,12.324630473961147,12.418380473961147,12.511032286469277,12.602614015550465,12.693152660184163,12.782674172555492,12.8712035125088,12.958764698465156,13.045380855077898,13.131074257875708,13.21586637512064,13.299777907088599,13.382828822961876,13.465038395507186,13.546425233698029,13.627007313427033,13.706802006441933,13.785826107628026],"log2jSqOverj":[0,0,0.5,1.3373687095640867,2.3373687095640867,3.4156387251295377,4.529310580151966,5.655202245637831,6.780202245637831,7.896693858389947,9.000214485150146,10.088184223698097,11.15918056799617,12.212507807042027,13.247932914364617,14.265519189434903,15.265519189434903,16.248304629352685,17.214319880333445,18.164050836095075,19.09800395896391,20.01669216574705,20.92062536398805,21.810304180087456,22.686215893963258,23.548831906415618,24.39860627348786,25.235974983051946,26.06135574543164,26.87514813677718,27.677733980686224,28.469477886552383,29.250727886552383,30.02181612992869,30.78305960525525,31.534760870052967,32.277208773401256,33.0106791617435,33.7354355613845,34.45172983356793,35.159802799746714,35.859884835897624,36.55219643561199,37.23694874231251,37.91434405137107,38.58457628318586,39.247831428455434,39.90428796699121,40.55411726145916,41.19748392745108,41.83454618126825,42.46545616676316,43.09036026253548,43.70939937072045,44.32270918854558,44.93042046376678,45.53265923503011,46.129547058141384,46.72120121916338,47.307734935200756,47.88925754367556,48.46587468084216,49.03768845023934,49.60479758172942,50.16729758172942,50.72528087519713,51.278836939896145,51.82805243342732,52.37301131348031,52.91379495172752,53.45048224175338,53.98314970138515,54.51187156976603,55.03671989948814,55.557764644081665,56.075073741135945,56.58871319131023,57.09874713347431,57.60523791620352,58.10824616583755,58.60783085129913]}
    const MessageEnums = {INITIALIZATION_PARAMS: 0,INITIALIZATION_SUCCESS: 1,NOISE_RESULTS: 2,NORMAL_RESULTS: 3,REQUEST_RESULTS: 4,DEBUG: 5,DEBUG_HISTOGRAM: 6, RAW_DATA_RESULTS: 7, ERROR: 8};
    //Number of variables that must exceed before considered speech or not noise
    const VARIABLES_FAIL_BEFORE_SIGNIFICANT = 3;
    //const FIRST_BIN = 0;//unused
    const LAST_BIN = 80;//MUST be 80. Otherwise, LINE_COEFFS must be updated
    const FFT1_BIN_COUNT = 512;
    const FFT2_BIN_COUNT = 128;
    const SILENCE_TIME_THRESHOLD = 1;
    const FFT512 = new FFTJS(FFT1_BIN_COUNT);
    const FFT128 = new FFTJS(FFT2_BIN_COUNT);
    const MIN_SKIP_TIME_MULTIPLIER = 5;
    const FRONT_PADDING_VALUE_MULITIPLIER = 1;
    //Take 30 samples for central limit theorem, then we can assume a normal distribution of values
    const NOISE_SAMPLE_COUNT = 30; // 512 / 48000 * 30 = 320ms

    //private static variables
    let referenceLineFeatures = undefined;

    /**
     * Processor to process TS files, Based off vad-audio-worklet-processor.js
     */
    class VADProcessor {
        /**
         * Processor to process TS files, Based off vad-audio-worklet-processor.js
         * @param {Array.<ArrayBuffer>} inputs array of arraybuffers containing PCM data of the TS file. Each row is 1 channel
         * @param {Object} options {isNoiseSample: boolean, startProcessingFrom: relative time, id: "00123.ts", startTime: Number, duration: Number, float32Length: Number, sampleRate: Number}
         */
        constructor(inputs, options) {
            //variables
            //Cached line coefficients for faster calculation
            //Message enums for easier reading
            //2 channels
            //https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4142156/
            this.inputs = inputs.map(input => { return new Float32Array(input); });
            this.duration = options.duration;
            this.startTime = options.startTime;
            this.float32Length = options.float32Length;
            this.sampleRate = options.sampleRate;
            this.isNoiseSample = options.isNoiseSample;
            this.startProcessingFrom = options.startProcessingFrom;
            //Assume sample rate is 48,000 Hz, precision of 1 FFT freq. bucket is 93.75 Hz
            //https://dsp.stackexchange.com/questions/2818/extracting-frequencies-from-fft
            //For most phonemes, almost all of the energy is contained in the 100 – 4000 Hz range
            //https://en.wikipedia.org/wiki/Sampling_(signal_processing)#Speech_sampling
            //We'd effectively only need to analyze the data from buffer[1] - buffer[42]
            //Take 2 stddev distance (68-95-99.7 rule) for each value, 95% confidence level for the distance to be considered significant
            //http://www.growingknowing.com/GKStatsBookNormalTable1.html
            //array of 5 to allow for customization of distance across the different variables
            //Customizable variables
            this.stddevDistance = [2.37, 2.37, 2.37, 2.37, 2.37];
            this.stddevDistance.fill(options.silenceThreshold);
            //Variables required in the processor
            this.buffers = [];
            this.fft512Out = FFT512.createComplexArray();
            this.fft128In = new Float32Array(FFT2_BIN_COUNT);
            this.fft128Out = FFT128.createComplexArray();
            this.continueBuffering = true;
            this.speakingHistory = 0;
            //Calculate the lag time in ms (basically the time spent buffering data to process it)
            this.lagTime = this.calculateLagTime();
            this.currentTime = 0;
            //48,000 samples per second, 1 interval is every FFT1_BIN_COUNT
            this.timePerInterval = FFT1_BIN_COUNT / this.sampleRate;
            this.minSkipTime = this.timePerInterval * MIN_SKIP_TIME_MULTIPLIER;
            this.resultsValueFrontPadding = this.timePerInterval * FRONT_PADDING_VALUE_MULITIPLIER;
            this.results = [];
            this.processedResults = false;

            //If using fixed noise sample, just use this
            if (!referenceLineFeatures && options.useFixedNoiseSample !== 0) {
                switch (options.useFixedNoiseSample) {
                    //in case we want to extend it to more options
                    /*
                    default: referenceLineFeatures = [
                        [
                            {lowerBound: 4.888785711454075, upperBound: 6.783195750496256},
                            {lowerBound: 2.1059212543708576, upperBound: 6.2027694188546185},
                            {lowerBound: 2.731769271190809, upperBound: 7.5631685867822185},
                            {lowerBound: 3.3279498376197383, upperBound: 12.767826545633696},
                            {lowerBound: 15.056480962156463, upperBound: 60.7670527762376},
                        ],
                        [
                            {lowerBound: 4.888785711454075, upperBound: 6.783195750496256},
                            {lowerBound: 2.1059212543708576, upperBound: 6.2027694188546185},
                            {lowerBound: 2.731769271190809, upperBound: 7.5631685867822185},
                            {lowerBound: 3.3279498376197383, upperBound: 12.767826545633696},
                            {lowerBound: 15.056480962156463, upperBound: 60.7670527762376}
                        ]
                    ];
                    break;*/
                     //*/
                     
                    default: referenceLineFeatures = [
                            [
                                {lowerBound: 5.222302787585955, upperBound: 8.18209849619599},
                                {lowerBound: -2.720560653024017, upperBound: 14.561054287714768},
                                {lowerBound: -4.433624334513411, upperBound: 21.18500421078679},
                                {lowerBound: -13.13957874661612, upperBound: 47.54697782432633},
                                {lowerBound: -64.13284327395473, upperBound: 228.51541204913292}
                            ],
                            [
                                {lowerBound: 5.210286374498044, upperBound: 8.191514976778304},
                                {lowerBound: -2.7224707609363428, upperBound: 14.563473340592378},
                                {lowerBound: -4.435583830295101, upperBound: 21.187714859610132},
                                {lowerBound: -13.162070808534374, upperBound: 47.53771603431636},
                                {lowerBound: -64.23850958165923, upperBound: 228.47060367552376}
                            ]
                        ];
                        break;
                        
                }
            }

            //Reserved values
            //this.referenceSamples
            //this.referenceData = Array of 2 arrays containing line features (each an array of 5 values)
            //this.headOfLastNonZeroLineFeatureIndexes = [-1,-1]
            //this.prevLineRefWasZero = [false,false];
            //this.noiseFadeOutPaddingSamples = Math.round(1 / timePerInterval); //When processing for noise reference, pad from the last zero line reference in case of fading out
        }
        
        /**
         * @typedef {Array.<Array.<{lowerBound: Number, upperBound: Number}>>} NoiseResult 2x5 matrix of objects containing lower and upper bound.
         */
        /**
         * @typedef {Array.<{isSpeaking: Boolean, time: Number}>} NormalResult Results containing if isSpeaking (true means a transition from no-speech to speech) and the timestamp
         */

        /**
         * Process inputs and return results
         * @returns {NoiseResult|NormalResult} If is noise sample: (2x5 matrix; 2 arrays 5 var). If is not, it will return Array.<{isSpeaking: Boolean, time: Number}>
         */
        process() {
            //this.isNoiseSample = true;
            //referenceLineFeatures = null;
            if (this.processedResults) return this.results;
            //Start from designated point
            let initialOffset = Math.floor(this.startProcessingFrom / this.duration * this.float32Length);
            //trim excess that we don't have enough info to process
            const size = this.float32Length - initialOffset;
            const length = initialOffset + size - (size % FFT1_BIN_COUNT);
            this.currentTime = initialOffset / this.sampleRate;
            if (this.isNoiseSample) {
                //If using fixed noise sample, just return the default values
                if (referenceLineFeatures) {
                    return referenceLineFeatures;
                } else {
                    this.setupNoiseReferenceData();
                }
            }
            for (let ofs = initialOffset; ofs < length; ofs += FFT1_BIN_COUNT) {
                if (this.continueBuffering) {
                    //Make shallow copies of the next set of samples
                    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/slice
                    for (var ch = 0; ch < this.inputs.length; ch++) {
                        this.buffers[ch] = this.inputs[ch].slice(ofs, ofs + FFT1_BIN_COUNT);
                        //this.log("buffer", [this.buffers[ch], this.inputs[ch]]);
                    }
                    //Progress in time
                    this.currentTime += this.timePerInterval;

                    if (this.isNoiseSample) { 
                        this.processNoiseReference();
                    } else { 
                        this.processData(true);
                    }
                } else break;
            }

            //if noise sample, get the last 30 samples with activity (with padding if necessary)
            if (this.isNoiseSample) { 
                this.compileNoiseReferenceResults();
            } else {
                this.compressNoiseResults();
            }

            return this.results;
        }

        /**
         * Setup the data structures for the noise reference
         */
        setupNoiseReferenceData() {
            if (this.referenceSamples == null) {
                this.referenceSamples = 0;
                this.referenceData = [];
                this.headOfLastNonZeroLineFeatureIndexes = [-1,-1];
                this.noiseFadeOutPaddingSamples = Math.round(1 / this.timePerInterval);
                this.prevLineRefWasZero = [false,false];
                this.channelsZeroed = [true, true];
                this.results = [];
                for (let i = 0; i < 2; i++) {
                    this.referenceData.push([]);
                    this.results.push([]);
                    for (let j = 0; j < 5; j++) {
                        this.results[i].push({mean: 0, stddev: 0});
                    }
                }
            }
        }

        /**
         * Process & average some samples of noise (assume that the start of the webcast is noise) as reference.
         * Store results in this.results.
         * @returns {undefined}
         */
        processNoiseReference() {
            let newData = this.processData(false);
            this.referenceSamples++;
            for (let i = 0; i < this.referenceData.length; i++) {
                this.referenceData[i].push(newData[i]);
                if (this.lineFeatureIsZero(newData[i])) {
                    if (!this.prevLineRefWasZero[i]) {
                        this.headOfLastNonZeroLineFeatureIndexes[i] = this.referenceData[i].length - 1;
                    }
                    this.prevLineRefWasZero[i] = true;
                } else {
                    this.prevLineRefWasZero[i] = false;
                }

                if (this.channelsZeroed[i] && !this.lineFeatureIsZero(newData[i])) {
                    this.channelsZeroed[i] = false;
                }
            }
        }

        /**
         * using this.referenceSamples, dynamically detect last active line reference.
         */
        compileNoiseReferenceResults() {
            //Determine bounds of noise reference
            let endIndex = Math.max(0, this.referenceData[0].length - 1 - this.noiseFadeOutPaddingSamples);
            //Must not be less than 0
            for (let i = 0; i < this.headOfLastNonZeroLineFeatureIndexes.length; i++) {
                //If channel was in use and zero was detected
                if (!this.channelsZeroed[i] && this.headOfLastNonZeroLineFeatureIndexes[i] > 0) {
                    //If endIndex was more, jump to new position
                    if (endIndex > this.headOfLastNonZeroLineFeatureIndexes[i])
                        endIndex = this.headOfLastNonZeroLineFeatureIndexes[i];
                }
            }
            let startIndex = Math.max(0, endIndex - NOISE_SAMPLE_COUNT);
            //Calculate sum of values in bounds
            for (let i = 0; i < this.referenceData.length; i++) {
                for (let j = startIndex; j <= endIndex; j++) {
                    for (let k = 0; k < 5; k++) {
                        this.results[i][k].mean += this.referenceData[i][j][k];
                    }
                }
            }

            let length = endIndex - startIndex + 1;//this.referenceData[i].length;
            //Calculate mean and std dev of each variable
            for (let i = 0; i < this.referenceData.length; i++) {
                for (let k = 0; k < 5; k++) {
                    //Calculate mean
                    this.results[i][k].mean /= length;
                    //Calculate variance & subsequently std dev
                    //for (let k = 0; k < this.referenceData[i][j].length; k++) {
                    for (let j = startIndex; j <= endIndex; j++) {
                        this.results[i][k].stddev += Math.pow(this.referenceData[i][j][k] - this.results[i][k].mean, 2);
                    }
                    this.results[i][k].stddev /= length - 1;
                    this.results[i][k].stddev = Math.sqrt(this.results[i][k].stddev);
                    //Calculate the final bounds for each variable
                    this.results[i][k] = {
                        lowerBound: this.results[i][k].mean - this.results[i][k].stddev * this.stddevDistance[k], 
                        upperBound: this.results[i][k].mean + this.results[i][k].stddev * this.stddevDistance[k]
                    };
                }
            }
            referenceLineFeatures = this.results;
            this.continueBuffering = false;
            /*
            //Check if noise results are null
            //If all zero, reject noise reference
            let allZero = true;
            for (let i = 0; i < this.results.length; i++) {
                for (let j = 0; j < this.results[i].length; j++) {
                    if (this.results[i][j] !== 0) {
                        allZero = false;
                        break;
                    }
                }
            }
            if (allZero) {
                referenceLineFeatures = undefined;
                this.result = undefined;
            }*/

            /*
            this.log('ref', 
                [
                this.referenceData,
                this.headOfLastNonZeroLineFeatureIndexes, 
                this.noiseFadeOutPaddingSamples, 
                this.channelsZeroed,
                startIndex,
                endIndex,
            ]);
            this.logSend();*/
        }

        compressNoiseResults() {
            let i = 1;
            while (i < this.results.length - 1) {
                if (this.results[i].isSpeaking) {
                    //If detected speaking time is only 1 interval, just remove both
                    if (this.results[i+1].time - this.results[i].time == this.timePerInterval) {
                        this.results.splice(i, 2);
                        continue;
                    }
                }
                i++;
            }
        }

        /**
         * Checks if a particular line feature is completely 0
         * @param {Array.<Number>} lineFeature Array of 5 numbers
         */
        lineFeatureIsZero(lineFeature) {
            //this.log('lf',lineFeature);
            for (let i = 0; i < lineFeature.length; i++) {
                if (lineFeature[i] !== 0)
                    return false;
            }
            return true;
        }

        /**
         * VAD section
         * https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4142156/
         * @param {Boolean} checkForSpeech Check if speaking against reference.
         * @returns {Array.<Array.<Number>>} array of line features, usually array of 2 line features of 5 variables
         */
        processData(checkForSpeech) {
            //process for both channels
            let lineFeatures = [];
            let isSpeaking = false;
            for (let i = 0; i < this.buffers.length; i++) {
                //Apply hamming window function, refer to http://download.ni.com/evaluation/pxi/Understanding%20FFTs%20and%20Windowing.pdf
                this.hammingWindow512(this.buffers[i]);
                //DCFT, but with 48k sample instead of downsampled 8k.
                //Don't want to downsample to reduce noise created from downsampling & reduce processing.
                //Instead, first FFT will FFT the entire 48k sample, then 2nd FFT will use the range from 0 - 12k Hz.
                //First FFT
                //this.log("buffer", this.buffers[i]);
                FFT512.realTransform(this.fft512Out, this.buffers[i]);
                //this.log("fft1Out", this.fft512Out);
                //Prepare magnitude of first 128 bins (0 - 12k Hz)
                this.binsToMagnitudeArray(this.fft512Out, FFT2_BIN_COUNT, this.fft128In);
                //this.log("fft2In1", [this.fft512Out, this.fft128In]);
                //Second FFT to better distinguish the harmonic signals from 0 Hz - 12k Hz
                FFT128.realTransform(this.fft128Out, this.fft128In);
                //this.log("fft2Out", [this.fft128Out, this.fft128In]);
                //Reuse the fft128In buffer to store our magnitudes
                this.binsToMagnitudeArray(this.fft128Out, LAST_BIN, this.fft128In);
                //this.log("fft2In2", this.fft128In);
                lineFeatures.push(this.calculateLineFeatures(this.fft128In, LAST_BIN));

                if (checkForSpeech && this.distanceOutsideBounds(lineFeatures[i], referenceLineFeatures[i])) {
                    isSpeaking = true;
                    break;
                }
            }

            //Implementation that involves checking for speech in the worklet
            if (isSpeaking) {
                if (this.speakingHistory === 0) {
                    this.changedSpeech(true);
                }
                this.speakingHistory = SILENCE_TIME_THRESHOLD;
            } else if (this.speakingHistory > 0) {
                this.speakingHistory--;
                if (this.speakingHistory === 0) {
                    this.changedSpeech(false);
                }
            }
            return lineFeatures;
        }

        /**
         * Use to convert a complex array to an array of magnitudes
         * @param {Array} complexArray Refer to FFT.js documentation
         * @param {Number} binCount number of bins
         * @param {Array} magArr Array of magnitudes
         * @returns {undefined} Passed by reference
         */
        binsToMagnitudeArray(complexArray, binCount, magArr) {
            //this.log("binsToMagnitudeArray", [complexArray, binCount, magArr]);
            for (let i = 0; i < binCount; i++) {
                magArr[i] = this.calculateFftBinMagnitude(complexArray, i);
                //this.log("midBins", [magArr, i, magArr[i]]);
            }
            //this.log("postBinsToMagnitudeArray", [complexArray, binCount, magArr]);
        }

        /**
         * Apply hamming window to the buffer
         * https://github.com/scijs/window-function#rectangular-i-n-
         * @param {Array} array segment to be windowed
         */
        hammingWindow512(array) {
            for (let i = 0; i < array.length; i++) {
                array[i] = array[i] * HAMMING_WINDOW_MULTIPLIER_512[i];//(0.54 - 0.46 * Math.cos((2 * Math.PI * i) / array.length - 1));
            }
        }

        /**
         * Use to calculate line features (see https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4142156/)
         * @param {Array} magArr Array of magnitudes
         * @param {Number} magArrLength 
         * @returns {Array.<Number>} line feature, contains 5 variables/coefficients 
         */
        calculateLineFeatures(magArr, magArrLength) {
            let lineFeatures = [];
            //Get Fmean and L
            let sumMagDivj = 0;
            let sumMagLog2JDivj = 0;
            let sumMag = 0;
            for (let j = 1; j <= magArrLength; j++) {
                //ERROR: CALCULATION ERROR HERE, LINE_COEFFS are SUM
                sumMagDivj += magArr[j] * LINE_COEFFS.jReciprocal[j];
                sumMagLog2JDivj += magArr[j] * LINE_COEFFS.log2jOverj[j];
                sumMag += magArr[j];
            }
            //lineFeatures.fMean
            if (sumMag != 0 || sumMagDivj != 0)
                lineFeatures.push(sumMag / sumMagDivj);
            else {//This is not entirely correct though
                //But for our purposes I'll assume 0 / 0 = 0 when magArr is completely 0 
                lineFeatures.push(0);
            }
            let l = Math.floor(lineFeatures[0]);
            //Calculate low index line fitting coeffs
            //Matrix values
            let a = SUMMED_COEFFS.jReciprocal[l];
            let bOrC = SUMMED_COEFFS.log2jOverj[l];
            let d = SUMMED_COEFFS.log2jSqOverj[l];
            let determinant = 1 / (a * d - bOrC * bOrC);
            if (determinant == Infinity) {
                //This is also not entirely correct either
                //but for our purposes I'll assume Infinity / 0 = 0
                determinant = 0;
            }
            let x = 0;
            let y = 0;
            for (let j = 1; j <= l; j++) {
                x += magArr[j] * LINE_COEFFS.jReciprocal[j];
                y += magArr[j] * LINE_COEFFS.log2jOverj[j];
            }
            //lineFeatures.al0 
            lineFeatures.push(determinant * (a * x + bOrC * y));
            //lineFeatures.al1 
            lineFeatures.push(determinant * (bOrC * x + d * y));
            for (let i = 0; i < lineFeatures.length; i++) {
                if (!isFinite(lineFeatures[i])) {
                    this.log("NaN LF Before", {magArr: magArr, lineFeatures: lineFeatures, sumMag: sumMag, sumMagDivj: sumMagDivj, sumMagLog2JDivj: sumMagLog2JDivj, determinant: determinant, a: a, bOrC: bOrC, d: d, x: x, y: y,l: l, magArrLength: magArrLength});
                    this.logSend(MessageEnums.ERROR);
                }
            }
            //Calculate high index line fitting coeffs
            a = SUMMED_COEFFS.jReciprocal[magArrLength] - a;
            bOrC = SUMMED_COEFFS.log2jOverj[magArrLength] - bOrC;
            d = SUMMED_COEFFS.log2jSqOverj[magArrLength] - d;
            determinant = 1 / (a * d - bOrC * bOrC);
            x = sumMagDivj - x;
            y = sumMagLog2JDivj - y;
            //lineFeatures.ah0 
            lineFeatures.push(determinant * (a * x + bOrC * y));
            //lineFeatures.ah1 
            lineFeatures.push(determinant * (bOrC * x + d * y));

            for (let i = 0; i < lineFeatures.length; i++) {
                if (!isFinite(lineFeatures[i])) {
                    this.log("NaN LF After", {magArr: magArr, lineFeatures: lineFeatures, sumMag: sumMag, sumMagDivj: sumMagDivj, sumMagLog2JDivj: sumMagLog2JDivj, determinant: determinant, a: a, bOrC: bOrC, d: d, x: x, y: y,l: l, magArrLength: magArrLength});
                    this.logSend(MessageEnums.ERROR);
                }
            }

            return lineFeatures;
        }

        /**
         * Check if the line features are within the "boundaries" of the noise reference signal
         * @param {Array.<Number>} lineFeatures Line features of length 5 (variables that define the signal)
         * @param {Array.<{Number, Number}>} boundsArr Array containing the lower and upper bounds of each line feature variable
         * @returns {Boolean} exceeded bounds
         */
        distanceOutsideBounds(lineFeatures, boundsArr) {
            let varExceeded = 0;
            for (let i = 0; i < lineFeatures.length; i++) {
                if (lineFeatures[i] < boundsArr[i].lowerBound || lineFeatures[i] > boundsArr[i].upperBound) {
                    varExceeded++;
                    if (varExceeded >= VARIABLES_FAIL_BEFORE_SIGNIFICANT) break;
                }
            }
            return varExceeded >= VARIABLES_FAIL_BEFORE_SIGNIFICANT;
        }

        /**
         * Calculate the magnitude for a specific FFT bin
         * @param {Array} complexArray Refer to FFT.js documentation
         * @param {Number} binIndex bin index in complex array
         * @returns {Number}
         */
        calculateFftBinMagnitude(complexArray, binIndex) {
            ////this.log("calculateFftBinMagnitude", [complexArray, binIndex, binIndex*2, complexArray[binIndex]*complexArray[binIndex] + complexArray[binIndex+1]*complexArray[binIndex+1], Math.sqrt(complexArray[binIndex]*complexArray[binIndex] + complexArray[binIndex+1]*complexArray[binIndex+1])]);
            binIndex *= 2;
            return Math.sqrt(complexArray[binIndex]*complexArray[binIndex] + complexArray[binIndex+1]*complexArray[binIndex+1]);
        }

        /**
         * Calculate the lag time in ms (basically the time spent buffering data to process it)
         * @returns {Number}
         */
        calculateLagTime() {
            return FFT1_BIN_COUNT / this.sampleRate;
        }

        /**
         * The threshold is now variant. Factors in minimum skip time to avoid stuttering.
         * Store into results upon changing speech
         * @param {Boolean} startedSpeech isSpeaking
         * @returns {undefined}
         */
        changedSpeech(startedSpeech) {
            let now = this.startTime + this.currentTime - this.lagTime;
            //If current results length is greater than the minimum time skipped, add.
            if (this.results.length <= 0 || now - this.results[this.results.length - 1].time > this.minSkipTime) {
                //If it is the start of speech, add padding to time
                if (startedSpeech) {
                    now -= this.resultsValueFrontPadding;
                    if (now < 0) {
                        now = 0;
                    }
                }
                this.results.push({
                    isSpeaking: startedSpeech, 
                    time: now
                });
            } else {
                this.results.pop();
            }
        }

        /**
         * Used for logging purposes to communicate debug data from processor
         * @param {*} key 
         * @param {*} value 
         * @returns {undefined}
         */
        log(key, value) {
            //Define self so to avoid collision with "this\.log"
            let self = this;
            if (self.logData == null) {
                self.logData = [];
            }
            self.logData.push({t: this.currentTime, k: key, v: value});
        }

        /**
         * Used to send debug logs (e.g. in the event of a crash).
         * @param {MessageEnums} definedEnum
         * @returns {undefined}
         */
        logSend(definedEnum = MessageEnums.DEBUG) {
            //Define self so to avoid collision with "this\.log"
            let self = this;
            if (self.logData == null) {
                self.logData = [];
            }
            this.sentLog = true;
            postMessage({data: self.logData, msgEnum: definedEnum});
            if (this.errorOccurred)
                this.continueBuffering = false;
        }

        /**
         * @returns {Boolean} if logSend was called
         */
        logBeenSent() {
            return this.sentLog === true;
        }

        /**
         * In the event that logSend was called with MesssageEnums.ERROR, the worklet will cease processing the TS.
         * @returns {Boolean}
         */
        errorOccurred() {
            return this.sentError;
        }

        /**
         * Precautionary clean up function to clean up references to Float32Arrays
         */
        cleanUp() {
            this.inputs = null;
            this.buffers = null;
            this.fft512Out = null
            this.fft128In = null;
            this.fft128Out = null;
        }
    }
    return VADProcessor;
})();