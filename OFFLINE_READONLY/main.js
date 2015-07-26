function getLaengen(RFelge, RLochkreisL, RLochkreisR, AL, AR, LochZahl, RSpeichenLoch, KreuzungsZahl) {
	"use strict";

	var coswinkel =  Math.cos((360 / LochZahl * KreuzungsZahl) / 57.3),
		LL = Math.sqrt(
			RFelge * RFelge  +
				RLochkreisL * RLochkreisL +
				AL * AL -
				2 * RFelge * RLochkreisL * coswinkel
		),
		LR = Math.sqrt(
			RFelge * RFelge  +
				RLochkreisR * RLochkreisR +
				AR * AR -
				2 * RFelge * RLochkreisR * coswinkel
		);
	LL = (LL - RSpeichenLoch).toFixed(2);
	LR = (LR - RSpeichenLoch).toFixed(2);
	return {links : LL, rechts : LR};
}

function getVals() {
	"use strict";

	var vals = [], i;

	for (i = 1; i < 10; i += 1) {
		vals[i] = document.getElementById("val" + i).value;
	}

	return vals;
}

function calc() {
	"use strict";

	var vals = getVals(), ergebnisse;

	if (vals[6] === vals[9]) {
		ergebnisse = getLaengen(
			vals[1] * 0.5,		//	1.) FelgenDurchmesser					D1
			vals[2] * 0.5,		//	2.) NabeLochkreisDurchmesserWDL			D2L
			vals[3] * 0.5,		//	3.) NabeLochkreisDurchmesserWDR			D2R
			vals[4],			//	4.) AbstandMitteZuSpeichenLoecherAL		AL
			vals[5],			//	5.) AbstandMitteZuSpeichenLoecherAR		AR
			vals[6] * 0.5,		//	6.) AnzahlSpeichenLoecher				Lochzahl
			vals[7] * 0.5,		//	7.) SpeichenLochDurchmesserNabe			DSL
			vals[8]				//	8.) AnzahlSpeichenKreuzungen			???(3)
		);
		console.log("Links: " + ergebnisse.links + "; Rechts: " + ergebnisse.rechts);
		document.getElementById("outl").value = ergebnisse.links;
		document.getElementById("outr").value = ergebnisse.rechts;
	} else {
		console.log("Ungleiche Speichenanzahl! (Felge: " + vals[9] + " Löcher & Nabe: " + vals[6] + " Löcher!)");
		alert("Ungleiche Speichenanzahl! (Felge: " + vals[9] + " Löcher & Nabe: " + vals[6] + " Löcher!)");
		document.getElementById("outl").value = "-";
		document.getElementById("outr").value = "-";
	}
}

function findentry(name, typ) {
	var teil, data
	if (typ) {
		data = nabendata;
	} else {
		data = felgendata;
	}

	data.some(function (entry) {
		if (entry._id == name) {
			teil = entry;
			return entry._id == name;
		}
	});

	return teil;
}

function readfelgen() {
	var obj, felge = document.getElementById("felgenfeld").value;
	console.log("hole werte für felge: " + felge + ".")
	obj = findentry(felge, 0);
	console.log("gefunden: " + obj);
	document.getElementById("val1").value = obj.durchmesser;
	document.getElementById("val9").value = obj.lochzahl;
	calc();
}

function readnaben() {
	var obj, nabe = document.getElementById("nabenfeld").value;
	console.log("hole werte für nabe: " + nabe + ".")
	obj = findentry(nabe, 1);
	console.log("gefunden: " + obj);
	document.getElementById("val2").value = obj.lochkreisDML;
	document.getElementById("val3").value = obj.lochkreisDMR;
	document.getElementById("val4").value = obj.abstandL;
	document.getElementById("val5").value = obj.abstandR;
	document.getElementById("val6").value = obj.lochzahl;
	document.getElementById("val7").value = obj.speichenlochDM;
	calc();
}

window.onload = function () {
	"use strict";

	var dl = document.getElementById("felgenfeld"), phe = document.createElement("option"), phz = document.createElement("option"), vi, i;
	phe.value = "";
	phe.innerHTML = "Felge Auswählen...";
	dl.innerHTML = "";
	dl.appendChild(phe);
	felgendata.forEach(function (felge) {
		var opt = document.createElement("option");
		opt.value = felge._id;
		opt.innerHTML = felge._id;
		dl.appendChild(opt);
	});

	phz.value = "";
	phz.innerHTML = "Nabe Auswählen...";
	dl = document.getElementById("nabenfeld");
	dl.innerHTML = "";
	dl.appendChild(phz);
	nabendata.forEach(function (nabe) {
		var opt = document.createElement("option");
		opt.value = nabe._id;
		opt.innerHTML = nabe._id;
		dl.appendChild(opt);
	});

	document.getElementById("felgenfeld").addEventListener("change", readfelgen);
	document.getElementById("nabenfeld").addEventListener("change", readnaben);

	document.getElementById("SLbutton").addEventListener("click", calc);

	vi = document.querySelectorAll("input:not([readonly])");
	for (i = 0; i < vi.length; i += 1) {
		vi[i].addEventListener("change", calc);
	}
};
