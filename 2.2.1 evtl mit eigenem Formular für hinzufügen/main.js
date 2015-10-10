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

	if ((vals[6] === vals[9]) && (vals[6] != 0)) {
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
		if ((document.getElementById("felgenfeld").value) && (document.getElementById("nabenfeld").value)) {
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

var formvisible = false, settingsvisible = false;

function valchg(what) {
	if (what == "f") {
		document.querySelector("#felgenform .save").classList.remove("hidden");
	};
	if (what == "n") {
		document.querySelector("#nabenform .save").classList.remove("hidden");
	};

	calc();
}

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

function cpu(el) {
	el.parentElement.classList.remove("expanded");

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
	console.log("popup closed")
}

function deletefelge() {
	if (document.querySelector("#felgenform .delete").classList.contains("expanded")) {
		felgenDB.get(document.getElementById("felgenfeld").value).then(function(felge) {
			return felgenDB.remove(felge);
		}).then(function (result) {
			console.log("Löschen:");
			console.log(result);
			document.querySelector("#felgenform .delete").classList.remove("expanded");
			document.getElementById("felgenfeld").selectedIndex = "0";
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
		nabenDB.get(document.getElementById("nabenfeld").value).then(function(nabe) {
			return nabenDB.remove(nabe);
		}).then(function (result) {
			console.log("Löschen:");
			console.log(result);
			document.querySelector("#nabenform .delete").classList.remove("expanded");
			document.getElementById("nabenfeld").selectedIndex = "0";
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
		felgenDB.get(document.getElementById("felgenfeld").value).then(function(felge) {
			return felgenDB.put({
				_id: felge._id,
				_rev: felge._rev,
				durchmesser: document.getElementById("val1").value,
				lochzahl: document.getElementById("val9").value
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
		console.log("Felge überschreiben?");
		document.querySelector("#felgenform .save").classList.add("expanded");
	};
}

function savenewfelge() {
	//ask for name
	//document.querySelector("#felgenform .save .nameinputs").style.height = ;

	felgenDB.put({
		_id: felge._id,
		durchmesser: document.getElementById("val1").value,
		lochzahl: document.getElementById("val9").value
	}).then(function(response) {
		console.log("Neue Felge Speichern:");
		console.log(response);
		document.querySelector("#felgenform .save").classList.remove("expanded");
		readfelgen();
		paint();
		document.querySelector("#felgenform .save").addEventListener("click", savefelge);
	}).catch(function (err) {
		alert("Fehler beim Eintragen, bitte nochmal versuchen.");
		console.log(err);
	});
}

function savenabe() {
	if (document.querySelector("#nabenform .save").classList.contains("expanded")) {
		nabenDB.get(document.getElementById("nabenfeld").value).then(function(nabe) {
			return nabenDB.put({
				_id: nabe._id,
				_rev: nabe._rev,
				lochkreisDML: document.getElementById("val2").value,
				lochkreisDMR: document.getElementById("val3").value,
				abstandL: document.getElementById("val4").value,
				abstandR: document.getElementById("val5").value,
				lochzahl: document.getElementById("val6").value,
				speichenlochDM:	document.getElementById("val7").value
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
	var felge = document.getElementById("felgenfeld").value, vi = [];

	if (felge) {
		document.querySelector("#felgenform .delete").classList.remove("hidden");
		console.log("hole werte für felge: " + felge + ".")
		findentry(felge, 0).then(function (teil) {
			console.log("zeichne...");
			document.getElementById("val1").value = teil.durchmesser;
			document.getElementById("val9").value = teil.lochzahl;
			calc();
	});
	} else {
		document.querySelector("#felgenform .delete").classList.add("hidden");

		vi = document.querySelectorAll("#felgenform input");
		for (i = 0; i < vi.length; i++) {
			vi[i].value = "";
		};
	};
	document.querySelector("#felgenform .save").classList.add("hidden");
}

function readnaben() {
	var nabe = document.getElementById("nabenfeld").value;

	if (nabe) {
		document.querySelector("#nabenform .delete").classList.remove("hidden");
		console.log("hole werte für nabe: " + nabe + ".")
		findentry(nabe, 1).then(function (teil) {
			console.log("zeichne...");
			document.getElementById("val2").value = teil.lochkreisDML;
			document.getElementById("val3").value = teil.lochkreisDMR;
			document.getElementById("val4").value = teil.abstandL;
			document.getElementById("val5").value = teil.abstandR;
			document.getElementById("val6").value = teil.lochzahl;
			document.getElementById("val7").value = teil.speichenlochDM;
			calc();
	});
	} else {
		document.querySelector("#nabenform .delete").classList.add("hidden");

		vi = document.querySelectorAll("#nabenform input");
		for (i = 0; i < vi.length; i++) {
			vi[i].value = "";
		};
	};
	document.querySelector("#nabenform .save").classList.add("hidden");
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
	var ans, bt = document.getElementById("REB");
	bt.innerHTML = "Arbeite...";

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
		bt.innerHTML = "Reset & Einlesen";
	}).catch(function (err) {
		console.log(err);
	});
}

window.onload = function () {
	"use strict";

	var vi, i;

	paint();

	document.getElementById("felgenfeld").addEventListener("change", readfelgen);
	document.getElementById("nabenfeld").addEventListener("change", readnaben);

	document.querySelector("#felgenform .delete").addEventListener("click", deletefelge);
	document.querySelector("#nabenform .delete").addEventListener("click", deletenabe);
	document.querySelector("#felgenform .save").addEventListener("click", savefelge);
	document.querySelector("#nabenform .save").addEventListener("click", savenabe);

	vi = document.querySelectorAll("#felgenform > input");
	console.log(vi);
	for (i = 0; i < vi.length; i++) {
		vi[i].addEventListener("change", function(){valchg("f");});
		vi[i].addEventListener("keypress", function(){valchg("f");});
	};

	vi = document.querySelectorAll("#nabenform > input");
	console.log(vi);
	for (i = 0; i < vi.length; i++) {
		vi[i].addEventListener("change", function(){valchg("n");});
		vi[i].addEventListener("keypress", function(){valchg("n");});
	};

	vi = document.querySelector("#rechnerform > input");
	vi.addEventListener("change", function(){valchg("");});
	vi.addEventListener("keypress", function(){valchg("");});

	document.getElementById("ShowFormButton").addEventListener("click", function() {
    	showPopup("atdb");
	});

	document.getElementById("SettingsButton").addEventListener("click", function() {
    	showPopup("set");
	});

	document.getElementById("backdrop").addEventListener("click", showPopup)

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

	if (valid) {
		return teil;
	} else {
		return false;
	};
}

function updatedfs(typ) {
	"use strict";

	dfs.innerHTML = "";

	if (typ) {
		console.log("zeige formular für naben...");

		document.getElementById("legende").style.display = "block";

		dfs.innerHTML += "<h3>Anzahl Speichenlöcher</h3>";
		dfs.innerHTML += "<input type=\"number\" id=\"ilochzahl\">";

		dfs.innerHTML += "<h3>Speichenlochdurchmesser</h3>";
		dfs.innerHTML += "<input type=\"number\" id=\"ispeichenlochDM\" step=\"0.05\">";

		dfs.innerHTML += "<h3>Lochkreisdurchmesser</h3>";
		dfs.innerHTML += "L&nbsp;<input type=\"number\" id=\"ilochkreisDML\" class=\"sides\">";
		dfs.innerHTML += "<input type=\"number\" id=\"ilochkreisDMR\" class=\"sides\">&nbsp;R";

		dfs.innerHTML += "<h3>Abstand (zur Mitte)</h3>";

		dfs.innerHTML += "L&nbsp;<input type=\"number\" id=\"iabstandL\" class=\"sides\">";
		dfs.innerHTML += "<input type=\"number\" id=\"iabstandR\" class=\"sides\">&nbsp;R";
	} else {
		console.log("zeige formular für felgen...");

		document.getElementById("legende").style.display = "none";

		dfs.innerHTML += "<h3>Anzahl Speichenlöcher</h3>";
		dfs.innerHTML += "<input type=\"number\" id=\"ilochzahl\">";

		dfs.innerHTML += "<h3>Felgendurchmesser</h3>";
		dfs.innerHTML += "<input type=\"number\" id=\"idurchmesser\">";
	};
}

function showSettings() {
	"use strict";

	console.log("showing settings");

	if (!settingsvisible) {
		document.getElementById("settings").style.display = "block";
		document.getElementById("SettingsButton").className = "hidden";
		document.getElementById("ShowFormButton").className = "active";
	} else {
		document.getElementById("settings").style.display = "none";
		document.getElementById("SettingsButton").className = "";
		document.getElementById("ShowFormButton").className = "";
	};

	settingsvisible = !settingsvisible;
}

function showform() {
	"use strict";

	if (!formvisible) {
		console.log("showing form");
		document.getElementById("form").style.display = "block";
		document.getElementById("ShowFormButton").className = "active";
	} else {
		console.log("hiding form");
		document.getElementById("form").style.display = "none";
		document.getElementById("ShowFormButton").className = "";
	};

	formvisible = !formvisible;

	document.getElementById("felgenradio").onchange = function() {
    	updatedfs(false);
 	};

	document.getElementById("nabenradio").onchange = function() {
		updatedfs(true);
	};

	console.log("event listeners set");
}

function showPopup(which) {
	document.getElementById("backdrop").style.display = "block";
	if (which == "atdb") {
		if (settingsvisible) {
			document.getElementById("backdrop").style.display = "none";
			showSettings();
		} else {
			if (formvisible) {
				document.getElementById("backdrop").style.display = "none";
			};
			showform();
		};
	} else {
		if (formvisible) {
			showform();
			if (which == "set") {
				showSettings();
			} else {
				document.getElementById("backdrop").style.display = "none";
			};
		} else {
			if (settingsvisible) {
				document.getElementById("backdrop").style.display = "none";
			};
			showSettings();
		};
	};
}

function addToDB() {
	var newpart = getNEValues();
	if (newpart) {
		if (document.getElementById("nabenradio").checked) {
			console.log("trage folgende Nabe in DB ein:");
			console.log(newpart);
			nabenDB.put(newpart).then(function (response) {
				console.log("Eintragen:");
				console.log(response);
				paint();
			}).catch(function (err) {
				console.log(err);
				alert("Fehler beim Eintragen, bitte nochmal versuchen.");
			});
		} else {
			console.log("trage folgende Felge in DB ein:");
			console.log(newpart);
			felgenDB.put(newpart).then(function (response) {
				console.log("Eintragen:");
				console.log(response);
				paint();
			}).catch(function (err) {
				console.log(err);
				alert("Fehler beim Eintragen, bitte nochmal versuchen.");
			});
		};
		showPopup("atdb");
	} else {
		alert("Fehlerhafte Eingabe. Trage nichts ein.");
	};
}
