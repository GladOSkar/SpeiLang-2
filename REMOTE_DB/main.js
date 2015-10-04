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

	if ((vals[6] === vals[9]) && (everythingisfilledOK("a"))) {
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
		outl.value = ergebnisse.links;
		outr.value = ergebnisse.rechts;

		blocker.classList.add("hidden");
	} else {
		if (everythingisfilledOK("a")) {
			console.log("Ungleiche Speichenanzahl! (Felge: " + vals[9] + " Löcher & Nabe: " + vals[6] + " Löcher!)");

			blocker.style.backgroundColor = "red";
			blocker.innerHTML = "Ungleiche Speichenlochanzahl";
			blocker.classList.remove("hidden");

			outl.value = "";
			outr.value = "";
		} else {
			blocker.style.backgroundColor = "green";
			blocker.innerHTML = "Bitte Alles Ausfüllen";
			blocker.classList.remove("hidden");
		}
	}
}

function everythingisfilledOK(where) {
	var ans = true, l, i;

	if (where == "f") {
		//check felgenfelder
		l = document.querySelectorAll("#felgenform > input");
	} else if (where == "n") {
		//check nabenfelder
		l = document.querySelectorAll("#nabenform > input");
	} else {
		//check alle felder
		if (!((val1.value && val9.value) && val8.value)) {
			ans = false;
		}
		l = document.querySelectorAll("#nabenform > input");
	};
	for (i = 0; i < l.length; i++) {
		if (l[i].value == "") {
			ans = false;
			return ans;
		};
	};
	return ans;
}

function valchg(what) {
	if (everythingisfilledOK(what)) {
		if (what == "f") {
			document.querySelector("#felgenform .save").classList.remove("hidden");
		};
		if (what == "n") {
			document.querySelector("#nabenform .save").classList.remove("hidden");
		};
	} else {
		if (what == "f") {
			document.querySelector("#felgenform .save").classList.add("hidden");
		};
		if (what == "n") {
			document.querySelector("#nabenform .save").classList.add("hidden");
		};
	};

	calc();
}

var felgenDB = new PouchDB('http://localhost:5984/felgen');
var nabenDB = new PouchDB('http://localhost:5984/naben');
var remoteCouch = false;

felgenDB.changes({
	since: 'now',
	live: true
}).on('change', paint);

nabenDB.changes({
	since: 'now',
	live: true
}).on('change', paint);

function cpu(el) {
	el.parentElement.classList.remove("expanded");
	if (el.parentElement.classList.contains("new")) {
		el.parentElement.lastChild.previousSibling.innerHTML = "Als neue Felge Speichern...";
		el.parentElement.classList.remove("new");
	};

	if (el.parentElement.parentElement.id == "nabenform") {
		if (el.parentElement.classList.contains("delete")) {
			setTimeout(function(){
				el.parentElement.addEventListener("click", deletenabe);
			}, 250);
		} else {
			setTimeout(function(){
				el.parentElement.addEventListener("click", savenabe);
			}, 250);
		};
	} else {
		if (el.parentElement.classList.contains("delete")) {
			setTimeout(function(){
				el.parentElement.addEventListener("click", deletefelge);
			}, 250);
		} else {
			setTimeout(function(){
				el.parentElement.addEventListener("click", savefelge);
			}, 250);
		};
	};
	console.log("popup closed");
}

function deletefelge() {
	if (document.querySelector("#felgenform .delete").classList.contains("expanded")) {
		felgenDB.get(felgenfeld.value).then(function(felge) {
			return felgenDB.remove(felge);
		}).then(function (result) {
			console.log("Löschen:");
			console.log(result);
			document.querySelector("#felgenform .delete").classList.remove("expanded");
			felgenfeld.selectedIndex = "0";
			readfelgen();
			paint();
			document.querySelector("#felgenform .delete").addEventListener("click", deletefelge);
		}).catch(function (err) {
			console.log(err);
			alert("Fehler beim Löschen, bitte nochmal versuchen.");
		});
	} else {
		document.querySelector("#felgenform .delete").removeEventListener("click", deletefelge);
		console.log("Felge löschen?");
		document.querySelector("#felgenform .delete").classList.add("expanded");
	};
}

function deletenabe() {
	if (document.querySelector("#nabenform .delete").classList.contains("expanded")) {
		nabenDB.get(document.nabenfeld.value).then(function(nabe) {
			return nabenDB.remove(nabe);
		}).then(function (result) {
			console.log("Löschen:");
			console.log(result);
			document.querySelector("#nabenform .delete").classList.remove("expanded");
			nabenfeld.selectedIndex = "0";
			readnaben();
			paint();
			document.querySelector("#nabenform .delete").addEventListener("click", deletenabe);
		}).catch(function (err) {
			console.log(err);
			alert("Fehler beim Löschen, bitte nochmal versuchen.");
		});
	} else {
		document.querySelector("#nabenform .delete").removeEventListener("click", deletenabe);
		console.log("Nabe löschen?");
		document.querySelector("#nabenform .delete").classList.add("expanded");
	};
}

function savefelge() {
	if (document.querySelector("#felgenform .save").classList.contains("expanded")) {
		felgenDB.get(felgenfeld.value).then(function(felge) {
			return felgenDB.put({
				_id: felge._id,
				_rev: felge._rev,
				durchmesser: val1.value,
				lochzahl: val9.value
			});
		}).then(function(response) {
			console.log("Speichern:");
			console.log(response);
			document.querySelector("#felgenform .save").classList.remove("expanded");
			readfelgen();
			paint();
			document.querySelector("#felgenform .save").addEventListener("click", savefelge);
		}).catch(function (err) {
			alert("Fehler beim Eintragen, bitte nochmal versuchen.");
			console.log(err);
		});
	} else {
		document.querySelector("#felgenform .save").removeEventListener("click", savefelge);
		console.log("Felge speichern / überschreiben?");
		document.querySelector("#felgenform .save").classList.add("expanded");
		if (felgenfeld.value) {

		} else {
			savenewfelge(document.querySelectorAll("#felgenform .save .btn")[2]);
		};
	};
}

function savenewfelge(btn) {
	if (document.querySelector("#felgenform .save").classList.contains("new")) {
		//check
		if ((document.querySelector("#felgenform .nameinputs input").value) &&
			(document.querySelectorAll("#felgenform .nameinputs input")[1].value)) {
			var nid = document.querySelector("#felgenform .nameinputs input").value.toUpperCase() + " " + document.querySelectorAll("#felgenform .nameinputs input")[1].value;

			felgenDB.put({
				_id: nid,
				durchmesser: val1.value,
				lochzahl: val9.value
			}).then(function(response) {
				console.log("Neue Felge Speichern:");
				console.log(response);
				document.querySelector("#felgenform .save").classList.remove("expanded");
				document.querySelector("#felgenform .save").classList.remove("new");
				btn.innerHTML = "Als neue Felge Speichern...";
				readfelgen();
				paint();
				document.querySelector("#felgenform .save").addEventListener("click", savefelge);
			}).catch(function (err) {
				alert("Fehler beim Eintragen, bitte nochmal versuchen.");
				console.log(err);
			});
		} else {
			alert("Bitte beide Felder ausfüllen!");
		};
	} else {
		//ask for name
		document.querySelector("#felgenform .save").classList.add("new");
		btn.innerHTML = "Speichern";
	};
}

function savenabe() {
	if (document.querySelector("#nabenform .save").classList.contains("expanded")) {
		nabenDB.get(nabenfeld.value).then(function(nabe) {
			return nabenDB.put({
				_id: nabe._id,
				_rev: nabe._rev,
				lochkreisDML: val2.value,
				lochkreisDMR: val3.value,
				abstandL: val4.value,
				abstandR: val5.value,
				lochzahl: val6.value,
				speichenlochDM:	val7.value
				});
		}).then(function(response) {
			console.log("Speichern:");
			console.log(response);
			document.querySelector("#nabenform .save").classList.remove("expanded");
			readnaben();
			paint();
			document.querySelector("#nabenform .save").addEventListener("click", savenabe);
		}).catch(function (err) {
			alert("Fehler beim Eintragen, bitte nochmal versuchen.");
			console.log(err);
		});
	} else {
		document.querySelector("#nabenform .save").removeEventListener("click", savenabe);
		console.log("Nabe überschreiben?");
		document.querySelector("#nabenform .save").classList.add("expanded");
	};
}

function savenewnabe(btn) {
	if (document.querySelector("#nabenform .save").classList.contains("new")) {
		//check
		if ((document.querySelector("#nabenform .nameinputs input").value) &&
			(document.querySelectorAll("#nabenform .nameinputs input")[1].value)) {
			var nid = document.querySelector("#nabenform .nameinputs input").value.toUpperCase() + " " + document.querySelectorAll("#nabenform .nameinputs input")[1].value;

			nabenDB.put({
				_id: nid,
				lochkreisDML: val2.value,
				lochkreisDMR: val3.value,
				abstandL: val4.value,
				abstandR: val5.value,
				lochzahl: val6.value,
				speichenlochDM:	val7.value
			}).then(function(response) {
				console.log("Neue Nabe Speichern:");
				console.log(response);
				document.querySelector("#nabenform .save").classList.remove("expanded");
				document.querySelector("#nabenform .save").classList.remove("new");
				btn.innerHTML += "...";
				readnaben();
				paint();
				document.querySelector("#nabenform .save").addEventListener("click", savenabe);
			}).catch(function (err) {
				alert("Fehler beim Eintragen, bitte nochmal versuchen.");
				console.log(err);
			});
		} else {
			alert("Bitte beide Felder ausfüllen!");
		};
	} else {
		//ask for name
		document.querySelector("#nabenform .save").classList.add("new");
		btn.innerHTML = btn.innerHTML.slice(0,-3);
	};
}

function findentry(name, typ) {
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
	var felge = felgenfeld.value, vi = [];

	if (felgenfeld.value) {
		document.querySelector("#felgenform .delete").classList.remove("hidden");
		console.log("hole werte für felge: " + felgenfeld.value + ".")
		findentry(felgenfeld.value, 0).then(function (teil) {
			console.log("zeichne...");
			val1.value = teil.durchmesser;
			val9.value = teil.lochzahl;
			calc();
	});
	} else {
		document.querySelector("#felgenform .delete").classList.add("hidden");

		var vi = document.querySelectorAll("#felgenform input");
		for (i = 0; i < vi.length; i++) {
			vi[i].value = "";
		};
	};
	document.querySelector("#felgenform .save").classList.add("hidden");
}

function readnaben() {
	if (nabenfeld) {
		document.querySelector("#nabenform .delete").classList.remove("hidden");
		console.log("hole werte für nabe: " + nabenfeld.value + ".")
		findentry(nabenfeld.value, 1).then(function (teil) {
			console.log("zeichne...");
			val2.value = teil.lochkreisDML;
			val3.value = teil.lochkreisDMR;
			val4.value = teil.abstandL;
			val5.value = teil.abstandR;
			val6.value = teil.lochzahl;
			val7.value = teil.speichenlochDM;
			calc();
	});
	} else {
		document.querySelector("#nabenform .delete").classList.add("hidden");

		var vi = document.querySelectorAll("#nabenform input");
		for (i = 0; i < vi.length; i++) {
			vi[i].value = "";
		};
	};
	document.querySelector("#nabenform .save").classList.add("hidden");
}

function paint() {
	var phe = document.createElement("option"),
		phz = document.createElement("option");

	phe.value = "";
	phe.innerHTML = "Felge Auswählen...";
	felgenfeld.innerHTML = "";
	felgenfeld.appendChild(phe);

	felgenDB.allDocs({
		include_docs: true,
	}).then(function (result) {
		result.rows.forEach(function (felge) {
			var opt = document.createElement("option");
			opt.value = felge.doc._id;
			opt.innerHTML = felge.doc._id;
			felgenfeld.appendChild(opt);
		});
	}).catch(function (err) {
		console.log(err);
	});

	phz.value = "";
	phz.innerHTML = "Nabe Auswählen...";
	nabenfeld.innerHTML = "";
	nabenfeld.appendChild(phz);

	nabenDB.allDocs({
		include_docs: true,
	}).then(function (result) {
		result.rows.forEach(function (nabe) {
			var opt = document.createElement("option");
			opt.value = nabe.doc._id;
			opt.innerHTML = nabe.doc._id;
			nabenfeld.appendChild(opt);
		});
	}).catch(function (err) {
		console.log(err);
	});
}

function parsefiles() {
	var ans;
	REB.innerHTML = "Arbeite...";

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
		REB.innerHTML = "Reset & Einlesen";
	}).catch(function (err) {
		console.log(err);
	});
}

window.onload = function () {
	"use strict";

	var vi, i;

	paint();

	felgenfeld.addEventListener("change", readfelgen);
	nabenfeld.addEventListener("change", readnaben);

	document.querySelector("#felgenform .delete").addEventListener("click", deletefelge);
	document.querySelector("#nabenform .delete").addEventListener("click", deletenabe);
	document.querySelector("#felgenform .save").addEventListener("click", savefelge);
	document.querySelector("#nabenform .save").addEventListener("click", savenabe);

	vi = document.querySelectorAll("#felgenform > input");
	for (i = 0; i < vi.length; i++) {
		vi[i].addEventListener("change", function(){valchg("f");});
		vi[i].addEventListener("keyup", function(){valchg("f");});
	};

	vi = document.querySelectorAll("#nabenform > input");
	for (i = 0; i < vi.length; i++) {
		vi[i].addEventListener("change", function(){valchg("n");});
		vi[i].addEventListener("keyup", function(){valchg("n");});
	};

	vi = document.querySelector("#rechnerform > input");
	vi.addEventListener("change", function(){valchg("");});
	vi.addEventListener("keyup", function(){valchg("");});

	settings.addEventListener("click", showSettings);

	backdrop.addEventListener("click", showSettings);

	felgenfeld.selectedIndex = "0";
	nabenfeld.selectedIndex = "0";
}

function showSettings() {
	"use strict";

	if (settings.classList.contains("expanded")) {
		console.log("closing settings");
		backdrop.style.display = "none";
		settings.classList.remove("expanded");
	} else {
		console.log("showing settings");
		backdrop.style.display = "block";
		settings.classList.add("expanded");
	};
}
