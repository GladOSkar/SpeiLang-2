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

		blocker.style.display = "none";
	} else {
		if ((!(document.getElementById("felgenfeld").value == "")) && (!(document.getElementById("nabenfeld").value == ""))) {
			console.log("Ungleiche Speichenanzahl! (Felge: " + vals[9] + " Löcher & Nabe: " + vals[6] + " Löcher!)");

			blocker.style.backgroundColor = "red";
			blocker.innerHTML = "Ungleiche Speichenlochanzahl";
			blocker.style.display = "block";

			document.getElementById("outl").value = "-";
			document.getElementById("outr").value = "-";
		} else {
			blocker.style.backgroundColor = "green";
			blocker.innerHTML = "Keine Auswahl getroffen"
			blocker.style.display = "block";
		}
	}
}

var formvisible = false;

var dfs = document.getElementById("datafields");

var felgenDB = new PouchDB('http://localhost:5984/felgen');
var nabenDB = new PouchDB('http://localhost:5984/naben');
var remoteCouch = false;

felgenDB.changes({
	since: 'now',
	live: true
}).on('change', paint);

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
		felge = {
			_id: document.getElementById("felgenfeld").value,
			durchmesser: vals[1],
			lochzahl: vals[9]
		};

	felgenDB.put(felge, callback(err, result));
}

function addNabe() {
	"use strict";

	var vals = getVals(),
		nabe = {
			_id: document.getElementById("nabenfeld").value,
			lochkreisDML: vals[2],
			lochkreisDMR: vals[3],
			abstandL: vals[4],
			abstandR: vals[5],
			speichenlochDM: vals[7],
			lochzahl: vals[6]
		};

	//nabenDB.put(nabe, callback(err, result));
}

function findentry(name, typ) {		//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	var teil;
	if (typ) {
		teil = nabenDB.get(name).then(function (nabe) {
			console.log("gefunden:");
			console.log(nabe);
  			return nabe;
		}).catch(function (err) {
			console.log(err);
		});
	} else {
		teil = felgenDB.get(name).then(function (felge) {
			console.log("gefunden:");
			console.log(felge);
  			return felge;
		}).catch(function (err) {
			console.log(err);
		});
	}

	return teil;
}

function readfelgen() {
	var felge = document.getElementById("felgenfeld").value;
	console.log("hole werte für felge: " + felge + ".")
	findentry(felge, 0).then(function (teil) {
		console.log("zeichne:");
		console.log(teil);
		document.getElementById("val1").value = teil.durchmesser;
		document.getElementById("val9").value = teil.lochzahl;
		calc();
	});
}

function readnaben() {
	var nabe = document.getElementById("nabenfeld").value;
	console.log("hole werte für nabe: " + nabe + ".")
	findentry(nabe, 1).then(function (teil) {
		console.log("gefunden: ");
		console.log(teil);
		document.getElementById("val2").value = teil.lochkreisDML;
		document.getElementById("val3").value = teil.lochkreisDMR;
		document.getElementById("val4").value = teil.abstandL;
		document.getElementById("val5").value = teil.abstandR;
		document.getElementById("val6").value = teil.lochzahl;
		document.getElementById("val7").value = teil.speichenlochDM;
		calc();
	});
}

function paint() {
	var phe = document.createElement("option"),
		phz = document.createElement("option"),
		fl = document.getElementById("felgenfeld"),
		nl = document.getElementById("nabenfeld");

	phe.value = "";
	phe.innerHTML = "Felge Auswählen...";
	fl.innerHTML = "";
	fl.appendChild(phe);

	felgenDB.allDocs({
		include_docs: true,
	}).then(function (result) {
		result.rows.forEach(function (felge) {
			var opt = document.createElement("option");
			opt.value = felge.doc._id;
			opt.innerHTML = felge.doc._id;
			fl.appendChild(opt);
		});
	}).catch(function (err) {
		console.log(err);
	});

	phz.value = "";
	phz.innerHTML = "Nabe Auswählen...";
	nl.innerHTML = "";
	nl.appendChild(phz);

	nabenDB.allDocs({
		include_docs: true,
	}).then(function (result) {
		result.rows.forEach(function (nabe) {
			var opt = document.createElement("option");
			opt.value = nabe.doc._id;
			opt.innerHTML = nabe.doc._id;
			nl.appendChild(opt);
		});
	}).catch(function (err) {
		console.log(err);
	});
}

function parsefiles() {
	var ans, bt = document.getElementById("REB").innerHTML;
	bt = "Arbeite...";

	felgenDB.allDocs({
		include_docs: true,
	}).then(function (result) {
		result.rows.forEach(function (felge) {
			felgenDB.remove(felge);
		});
	}).catch(function (err) {
		console.log(err);
	});

	nabenDB.allDocs({
		include_docs: true,
	}).then(function (result) {
		result.rows.forEach(function (nabe) {
			nabenDB.remove(nabe);
		});
	}).catch(function (err) {
		console.log(err);
	});

	Promise.all([felgenDB.bulkDocs(felgendata),
				 nabenDB.bulkDocs(nabendata)]).then(function (arrayOfResults) {
		paint();
		bt = "Reset & Einlesen";
	}).catch(function (err) {
		console.log(err);
	});

	/*felgenDB.bulkDocs(felgendata).then(function (result) {
		return result;
	}).then(function (result) {
		nabenDB.bulkDocs(nabendata);
	})

	catch(function (err) {
		console.log(err);
	});

	nabenDB.bulkDocs(nabendata).then(function (result) {
		// handle result
	}).catch(function (err) {
		console.log(err);
	});

	paint();*/
}

window.onload = function () {
	"use strict";

	var vi, i;

	paint();

	document.getElementById("felgenfeld").addEventListener("change", readfelgen);
	document.getElementById("nabenfeld").addEventListener("change", readnaben);

	vi = document.querySelectorAll("input:not([readonly])");
	for (i = 0; i < 9; i += 1) {
		vi[i].addEventListener("change", calc);
	};

	document.getElementById("ShowFormButton").addEventListener("click", showform);

	updatedfs(document.getElementById("nabenradio").checked);

	document.getElementById("submitbutton").addEventListener("click", addToDB);
}

function getNEValues() {
	var i, valid = true, teil = {}, inputs = [];

	inputs = document.querySelectorAll("#form input:not([type=\"radio\"])");

	teil._id = inputs[0].value.toUpperCase() + " " + inputs[1].value;

	for (i = 2; i < inputs.length; i++) {
		teil[inputs[i].id.substring(1)] = inputs[i].value;
	};

	if (document.getElementById("aussenabs").checked) {
		//if (teil.EBM > (teil.abstandL + teil.abstandR)) {
			teil.abstandL = teil.EBM * 0.5 - teil.abstandL;
			teil.abstandR = teil.EBM * 0.5 - teil.abstandR;
			delete teil.EBM;
		//} else {
		//	alert("Das Einbaumaß muss größer sein als die Abstände zusammen!");
		//	valid = false;
		//};
	};

	if (valid) {
		return teil;
	} else {
		return false;
	};
}

function updateAbstyp() {
	if (document.getElementById("aussenabs").checked) {
		document.getElementById("abstyparea").innerHTML = "<h3>Gesamtbreite</h3><input type=\"number\" id=\"iEBM\">";
	} else {
		document.getElementById("abstyparea").innerHTML = "";
	};
}

function updatedfs(typ) {
	"use strict";

	dfs.innerHTML = "";

	if (typ) {
		console.log("zeige formular für naben...");

		dfs.innerHTML += "<h3>Anzahl Speichenlöcher</h3>";
		dfs.innerHTML += "<input type=\"number\" id=\"ilochzahl\">";

		dfs.innerHTML += "<h3>Speichenlochdurchmesser</h3>";
		dfs.innerHTML += "<input type=\"number\" id=\"ispeichenlochDM\">";

		dfs.innerHTML += "<h3>Lochkreisdurchmesser</h3>";
		dfs.innerHTML += "L&nbsp;<input type=\"number\" id=\"ilochkreisDML\" class=\"sides\">";
		dfs.innerHTML += "<input type=\"number\" id=\"ilochkreisDMR\" class=\"sides\">&nbsp;R";

		dfs.innerHTML += "<h3>Abstand</h3>";

		dfs.innerHTML += "<input type=\"radio\" name=\"abstyp\" id=\"aussenabs\" onchange=\"updateAbstyp();\" checked>";
		dfs.innerHTML += "<label for=\"aussenabs\">Außen</label>&nbsp;";
		dfs.innerHTML += "<input type=\"radio\" name=\"abstyp\" id=\"innenabs\" onchange=\"updateAbstyp();\">";
		dfs.innerHTML += "<label for=\"innenabs\">Innen</label>";
		dfs.innerHTML += "<br>";

		dfs.innerHTML += "L&nbsp;<input type=\"number\" id=\"iabstandL\" class=\"sides\">";
		dfs.innerHTML += "<input type=\"number\" id=\"iabstandR\" class=\"sides\">&nbsp;R";

		dfs.innerHTML += "<div id=\"abstyparea\"></div>";

		updateAbstyp();

	} else {
		console.log("zeige formular für felgen...");//

		dfs.innerHTML += "<h3>Anzahl Speichenlöcher</h3>";
		dfs.innerHTML += "<input type=\"number\" id=\"ilochzahl\">";

		dfs.innerHTML += "<h3>Felgendurchmesser</h3>";
		dfs.innerHTML += "<input type=\"number\" id=\"idurchmesser\">";

	};
}

function showform() {
	"use strict";
	//TODO: lay form over ui

	console.log("showing form");

	formvisible = !formvisible;

	if (formvisible) {
		document.getElementById("form").style.display = "block";
		document.getElementById("ShowFormButton").style.transform = "rotate(45deg)";
		document.getElementById("ShowFormButton").style.backgroundColor = "red";
	} else {

		document.getElementById("form").style.display = "none";
		document.getElementById("ShowFormButton").style.transform = "rotate(0deg)";
		document.getElementById("ShowFormButton").style.backgroundColor = "magenta";
	};

	document.getElementById("felgenradio").onchange = function() {
    	updatedfs(false);
 	};

	document.getElementById("nabenradio").onchange = function() {
		updatedfs(true);
	};

	console.log("event listeners set");
}

function addToDB() {
	var newpart = getNEValues();
	if (newpart) {
		console.log("trage folgendes Objekt in DB ein:");
		console.log(newpart);
		showform();
	} else {
		console.log("Fehlerhafte Eingabe. Trage nichts ein.");
	};
}
