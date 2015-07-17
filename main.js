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

document.getElementById("SLbutton").addEventListener("click", calc);

var felgenDB = new PouchDB('felgen');
var nabenDB = new PouchDB('naben');
var remoteCouch = false;

/* felgenDB.changes({
	since: 'now',
	live: true
}).on('change', updateFelgen); */

function callback(err, result) {
	"use strict";

	if (!err) {
		console.log('Neues Teil erfolgreich eingetragen!');
	} else {
		console.log(err);
	}
}

function addFelge() {
	"use strict";

	var vals = getVals(),
		teil = {
			_id: document.getElementById("felgenfeld").value,
			durchmesser: vals[1],
			lochzahl: vals[9]
		};

	felgenDB.put(teil, callback(err, result));
};

function addNabe() {
	var vals = getVals();

	var teil = {
		_id: document.getElementById("nabenfeld").value,
		lochkreisDML: vals[2],
		lochkreisDMR: vals[3],
		abstandL: vals[4],
		abstandR: vals[5],
		speichenlochDM: vals[7],
		lochzahl: vals[6]
	}

	felgenDB.put(teil, callback(err, result));
};
function updateFelgen() {
	felgenDB.allDocs({include_docs: true, descending: true}, function(err, doc) {
		for row in doc.rows do {
			/* var item = document.createElement("option")
			item.value = row.name;
			document.getElementById("felgenliste").appendChild() */
		};
	});
};

updateFelgen;
