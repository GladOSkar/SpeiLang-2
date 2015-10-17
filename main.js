function getLaengen(RFelge,
					RLochkreisL,
					RLochkreisR,
					AL,
					AR,
					LochZahl,
					RSpeichenLoch,
					KreuzungsZahl) {
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

function getval(form,feld) {
	var sel;
	if (form == "n") {
		sel = "#nabenform > input";
	} else
	if (form == "f") {
		sel = "#felgenform > input";
	} else {
		sel = "#rechnerform > input";
	}
	return document.querySelectorAll(sel)[feld-1].value;
}

function calc() {
	if ((getval("n",6) == getval("f",2)) && (everythingisfilledOK("a"))) {
		ergebnisse = getLaengen(
			getval("f",1) * 0.5,		//	1.) FelgenDurchmesser					D1
			getval("n",1) * 0.5,		//	2.) NabeLochkreisDurchmesserWDL			D2L
			getval("n",2) * 0.5,		//	3.) NabeLochkreisDurchmesserWDR			D2R
			getval("n",3),				//	4.) AbstandMitteZuSpeichenLoecherAL		AL
			getval("n",4),				//	5.) AbstandMitteZuSpeichenLoecherAR		AR
			getval("n",6) * 0.5,		//	6.) AnzahlSpeichenLoecher				Lochzahl
			getval("n",5) * 0.5,		//	7.) SpeichenLochDurchmesserNabe			DSL
			getval("r",1)				//	8.) AnzahlSpeichenKreuzungen			???(3)
		);
		console.log("Links: " + ergebnisse.links + "; Rechts: " + ergebnisse.rechts);
		outl.value = ergebnisse.links;
		outr.value = ergebnisse.rechts;

		blocker.classList.add("hidden");
	} else {
		if (everythingisfilledOK("a")) {
			console.log("Ungleiche Speichenanzahl! (Felge: " + getval("f",2) + " Löcher & Nabe: " + getval("n",6) + " Löcher!)");

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
		if (!((getval("f",1) && getval("f",2)) && getval("r",1))) {
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

if (localStorage.getItem("ip")) {
	var felgenDB = new PouchDB("http://" + localStorage.getItem("ip") + ":5984/felgen", {auto_compaction: true});
	var nabenDB = new PouchDB("http://" + localStorage.getItem("ip") + ":5984/naben", {auto_compaction: true});
} else {
	var felgenDB = new PouchDB("http://localhost:5984/felgen", {auto_compaction: true});
	var nabenDB = new PouchDB("http://localhost:5984/naben", {auto_compaction: true});
};

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
	if ((document.querySelector("#felgenform .save").classList.contains("expanded")) && ((felgenfeld.value) && (felgenfeld.nextElementSibling.value))) {
		if (felgenfeld.value == felgenfeld.nextElementSibling.value) {
			felgenDB.get(felgenfeld.value).then(function(felge) {
				return felgenDB.put({
					_id: felge._id,
					_rev: felge._rev,
					durchmesser: getval("f",1),
					lochzahl: getval("f",2)
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
			felgenDB.get(felgenfeld.value).then(function(felge) {
				console.log(felge);
				felgenDB.remove(felge).then(function(response) {
					console.log(response);
					felgenDB.put({
						_id: felgenfeld.nextElementSibling.value,
						durchmesser: getval("f",1),
						lochzahl: getval("f",2)
					}).then(function(response) {
						console.log(response);
						paint();
						readfelgen();
						felgenfeld.nextElementSibling.value = "Felge Auswählen...";
						document.querySelector("#felgenform .save").classList.remove("expanded");
						document.querySelector("#felgenform .save").addEventListener("click", savefelge);
					}).catch(function (err) {
						alert("Fehler beim Eintragen, bitte nochmal versuchen.");
						console.log(err);
					});
				}).catch(function (err) {
					alert("Fehler beim Eintragen, bitte nochmal versuchen.");
					console.log(err);
				});
			}).catch(function (err) {
				alert("Fehler beim Eintragen, bitte nochmal versuchen.");
				console.log(err);
			});
		};
	} else {
		document.querySelector("#felgenform .save").removeEventListener("click", savefelge);
		console.log("Felge speichern / überschreiben?");
		document.querySelector("#felgenform .save").classList.add("expanded");
		if (!felgenfeld.value) {
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
				durchmesser: getval("f",1),
				lochzahl: getval("f",2)
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
	if ((document.querySelector("#nabenform .save").classList.contains("expanded")) && ((nabenfeld.value) && (nabenfeld.nextElementSibling.value))) {
		if (nabenfeld.value == nabenfeld.nextElementSibling.value) {
			return nabenDB.get(nabenfeld.value).then(function(nabe) {
				return nabenDB.put({
					_id: nabe._id,
					_rev: nabe._rev,
					lochkreisDML: getval("n",1),
					lochkreisDMR: getval("n",2),
					abstandL: getval("n",3),
					abstandR: getval("n",4),
					lochzahl: getval("n",6),
					speichenlochDM:	getval("n",5)
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
			nabenDB.get(nabenfeld.value).then(function(nabe) {
				console.log(nabe);
				nabenDB.remove(nabe).then(function(response) {
					console.log(response);
					nabenDB.put({
						_id: nabenfeld.nextElementSibling.value,
						lochkreisDML: getval("n",1),
						lochkreisDMR: getval("n",2),
						abstandL: getval("n",3),
						abstandR: getval("n",4),
						lochzahl: getval("n",6),
						speichenlochDM:	getval("n",5)
					}).then(function(response) {
						console.log(response);
						paint();
						readnaben();
						nabenfeld.nextElementSibling.value = "Nabe Auswählen...";
						document.querySelector("#nabenform .save").classList.remove("expanded");
						document.querySelector("#nabenform .save").addEventListener("click", savenabe);
					}).catch(function (err) {
						alert("Fehler beim Eintragen, bitte nochmal versuchen.");
						console.log(err);
					});
				}).catch(function (err) {
					alert("Fehler beim Eintragen, bitte nochmal versuchen.");
					console.log(err);
				});
			}).catch(function (err) {
				alert("Fehler beim Eintragen, bitte nochmal versuchen.");
				console.log(err);
			});
		};
	} else {
		document.querySelector("#nabenform .save").removeEventListener("click", savenabe);
		console.log("Nabe speichern / überschreiben?");
		document.querySelector("#nabenform .save").classList.add("expanded");
		if (!nabenfeld.value) {
			savenewnabe(document.querySelectorAll("#nabenform .save .btn")[2]);
		};
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
				lochkreisDML: getval("n",1),
				lochkreisDMR: getval("n",2),
				abstandL: getval("n",3),
				abstandR: getval("n",4),
				lochzahl: getval("n",6),
				speichenlochDM:	getval("n",5)
			}).then(function(response) {
				console.log("Neue Nabe Speichern:");
				console.log(response);
				document.querySelector("#nabenform .save").classList.remove("expanded");
				document.querySelector("#nabenform .save").classList.remove("new");
				btn.innerHTML = "Als neue Nabe Speichern...";
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
		btn.innerHTML = "Speichern";
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

		val1.value = "";
		val9.value = 36;
	};
	document.querySelector("#felgenform .save").classList.add("hidden");
}

function readnaben() {
	if (nabenfeld.value) {
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

		var vi = document.querySelectorAll("#nabenform > input");
		for (i = 0; i < vi.length - 2; i++) {
			vi[i].value = "";
		};
		val7.value = 2.5;
		val6.value = 36;
	};
	document.querySelector("#nabenform .save").classList.add("hidden");
}

function paint() {
	var phe = document.createElement("option"),
		phz = document.createElement("option");

	console.log("erstelle Listen...");

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
	settings.addEventListener("touchend", showSettings);

	backdrop.addEventListener("click", showSettings);

	felgenfeld.selectedIndex = "0";
	nabenfeld.selectedIndex = "0";

	ipfeld.value = localStorage.getItem("ip");
	ipfeld.previousElementSibling.setAttribute("href","http://" + ip + ":5984/_utils/fauxton/")
}

function showSettings() {
	"use strict";

	if (settings.classList.contains("expanded")) {
		console.log("closing settings");
		backdrop.style.display = "none";
		settings.classList.remove("expanded");
		closer.classList.add("hidden");
		setTimeout(function(){
			settings.addEventListener("click", showSettings);
			settings.addEventListener("touchend", showSettings);
		}, 200);
	} else {
		console.log("showing settings");
		backdrop.style.display = "block";
		settings.classList.add("expanded");
		settings.removeEventListener("click", showSettings);
		settings.removeEventListener("touchend", showSettings);
		setTimeout(function(){
			closer.classList.remove("hidden");
		}, 300);
	};
}

function getdocfromans(ans) {
	delete ans.doc._rev;
	return JSON.stringify(ans.doc);
}

function exportDB() {

	spinnergear.classList.add("spinning");

	var data = "[["
	felgenDB.allDocs({
		include_docs: true,
	}).then(function (result) {

		data += result.rows.map(getdocfromans);
		data += "],["

		nabenDB.allDocs({
			include_docs: true,
		}).then(function (result) {
			data += result.rows.map(getdocfromans);
			data += "]]";

			exportlink.setAttribute("href","data:text/json;charset=utf-8," + encodeURIComponent(data));
			var d = new Date();
			exportlink.setAttribute("download","SpeiLang_Export_" + d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + ".json");
			exportlink.click();
			showSettings();
			spinnergear.classList.remove("spinning");
		}).catch(function (err) {
			console.log(err);
		});
	}).catch(function (err) {
		console.log(err);
	});
}

function importDB(file,final) {
	if (window.confirm("Sind sie sich sicher, dass sie die momentane Datenbank mit der aus der folgenden Datei ersetzen wollen?\n · Name: " + file.name + "\n · Zuletzt geändert am: " + file.lastModifiedDate.toLocaleDateString() + "\n · Größe: " + file.size + " bytes")) {

		var reader = new FileReader();

		reader.onload = (function(theFile) {
			return function(evt) {
				var goodtogo = true;
				try {
					data = JSON.parse(evt.target.result);
				} catch(err) {
					alert("Ungültige Datenbankdatei!\n" + err);
					goodtogo = false;
				};

				if (goodtogo) {

					spinnergear.classList.add("spinning");

					Promise.all([
						felgenDB.destroy(),
						nabenDB.destroy()
					]).then(function(arrayOfResults) {
						if (arrayOfResults.every(obj => obj.ok)) {
							felgenDB = new PouchDB('http://localhost:5984/felgen');
							nabenDB = new PouchDB('http://localhost:5984/naben');

							Promise.all([
								felgenDB.bulkDocs(data[0]),
								nabenDB.bulkDocs(data[1])
							]).then(function() {
								paint();
								showSettings();
								spinnergear.classList.remove("spinning");
							}).catch(function (err) {
								alert("Unbekannter Fehler beim einlesen der Datenbank");
								console.log(err);
							});
						} else {
							alert("Fehler beim Löschen der alten Datenbank");
						};
					}).catch(function (err) {
						console.log(err);
					});
				};
			};
		})(file);

		reader.readAsText(file)
	};
}

function setip(ip) {
	console.log("Setting Server IP to " + ip);
	localStorage.setItem("ip", ip);
	ipfeld.previousElementSibling.setAttribute("href","http://" + ip + ":5984/_utils/fauxton/");
	window.location.reload(false);
}
