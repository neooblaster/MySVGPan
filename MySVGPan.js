/** ----------------------------------------------------------------------------------------------------------------------- ** 
/** ----------------------------------------------------------------------------------------------------------------------- ** 
/** ---																																						--- **
/** --- 															------------------------															--- **
/** ---																	{ MySVGPan.js }																--- **
/** --- 															------------------------															--- **
/** ---																																						--- **
/** ---		AUTEUR 	: Nicolas DUPRE																												--- **
/** ---																																						--- **
/** ---		RELEASE	: 10.09.2015																													--- **
/** ---																																						--- **
/** ---		VERSION	: 1.0																																--- **
/** ---																																						--- **
/** ---																																						--- **
/** --- 														-----------------------------															--- **
/** --- 															 { C H A N G E L O G } 																--- **
/** --- 														-----------------------------															--- **
/** ---																																						--- **
/** ---		VERSION 1.0 : 10.09.2015																												--- **
/** ---		------------------------																												--- **
/** ---			- Première release																													--- **
/** ---																																						--- **
/** --- 											-----------------------------------------------------										--- **
/** --- 												{ L I S T E      D E S      M E T H O D E S } 											--- **
/** --- 											-----------------------------------------------------										--- **
/** ---																																						--- **
/** ----------------------------------------------------------------------------------------------------------------------- **
/** ----------------------------------------------------------------------------------------------------------------------- **

	Objectif de la fonction :
	-------------------------
		
	Description fonctionnelle :
	---------------------------
	
		Source : https://msdn.microsoft.com/fr-fr/library/gg589508%28v=vs.85%29.aspx?f=255&MSPPError=-2147217396

/** ----------------------------------------------------------------------------------------------------------------------- **
/** ----------------------------------------------------------------------------------------------------------------------- **/
function SVGPanEngine(){
	/** -------------------------------------------------------------------------------------------------------------------- **
	/** ---																																					--- **
	/** ---												Déclaration des propriétés de l'instance												--- **
	/** ---																																					--- **
	/** -------------------------------------------------------------------------------------------------------------------- **/
	var self = this;
	
	self.CSSRuleRecorded = false;	// Indique que la règle CSS dédié à MySVGPan est enregistrée
	self.over = false;
	self.handled = false;			// Indique que l'utilisateur maintient le SVG par clic
	self.controllable = false;		// Indique que le SVG est controllable (Zoom + Pan)
	self.lastX = null;
	self.lastY = null;
	
	
	/** -------------------------------------------------------------------------------------------------------------------- **
	/** ---																																					--- **
	/** ---												Déclaration des méthodes de l'instance													--- **
	/** ---																																					--- **
	/** -------------------------------------------------------------------------------------------------------------------- **/
	/** Méthode d'initialisation des objets SVG **/
	self.init = function(){
		if(document.readyState === 'complete'){
			/** Initialisation des variables **/
			// Récupération de l'ensemble des documents SVG
			var SVGSchemes = document.querySelectorAll('svg');
			
			// Récupération des propriété d'affichage : Largeur disponible & Determination du zoom
			var screenWidth = (window.screen.availWidth * 0.99) - 55 - 55;
			var screenZoom = window.outerWidth / window.innerWidth;
			
			// Calcul de la largeur en rapport avec le zoom
			var relWidth = screenWidth / screenZoom;
			
			// Initialisation de valeur de références : Rapport Inch to Pixel & Rapport
			var INToPX = 96;
			var boxViewCoef = 72;
			
			/** Parcourir les documents SVG récupéré **/
			for(var i = 0; i < SVGSchemes.length; i++){
				/** Instance en cours de manipulation (alegement du code) **/
				var workingSVG = SVGSchemes[i];
				
				/** Récupérer les dimensions originales **/
				var SVGWidth = workingSVG.getAttribute('width');
				var SVGHeight = workingSVG.getAttribute('height');
				var SVGviewBox = workingSVG.getAttribute('viewBox').split(' ');
				
				/** Sauvegarder les valeurs orginales **/
				workingSVG.setAttribute('savedWidth', SVGWidth);
				workingSVG.setAttribute('savedHeight', SVGHeight);
				workingSVG.setAttribute('document', SVGviewBox[2]+' '+SVGviewBox[3]);
				
				/** Conversion en Pixel **/
				SVGWidth = parseFloat(SVGWidth) * INToPX;
				SVGHeight = parseFloat(SVGHeight) * INToPX;
				
				/** Calculer le ratio **/
				var SVGRatio = SVGWidth / SVGHeight;
				
				/** Si le SVG est plus grand que l'écran, alors le réduire **/
				if(SVGWidth > relWidth){
					//var adjustedWidth = relWidth/ INToPX;
					var adjustedWidth = relWidth;
					//var adjustedHeigh = (relWidth / SVGRatio)/ INToPX;
					var adjustedHeight = (relWidth / SVGRatio);
					
					//workingSVG.setAttribute('width', adjustedWidth+'in');
					workingSVG.setAttribute('width', adjustedWidth+'px');
					//workingSVG.setAttribute('height', adjustedHeigh+'in');
					workingSVG.setAttribute('height', adjustedHeight+'px');
					
					workingSVG.setAttribute('currentScale', (relWidth / SVGWidth));
				} else {
					workingSVG.setAttribute('width', SVGWidth+'px');
					workingSVG.setAttribute('height', SVGHeight+'px');
					workingSVG.setAttribute('currentScale', '1');
				}
				
				// Approuvé le document SVG
				workingSVG.classList.add('approved');
				
				// Ajouter les écouteurs d'évenements 
				workingSVG.addEventListener('mousewheel', self.zoom.bind('', workingSVG));
				workingSVG.addEventListener('mousedown', self.handle);
				workingSVG.addEventListener('mouseup', self.release);
				workingSVG.addEventListener('mousemove', self.pan.bind('', workingSVG));
				workingSVG.addEventListener('dblclick', self.reset.bind('', workingSVG));
			}
			
			/** Ajouter une règle CSS **/
			self.recordRule();
		}
	};
	
	/** Méthode de gestion de zoom (Zoom In & Zoom Out) **/
	self.zoom = function(SVG, e){
		if(e.ctrlKey){
			/** Déterminer la position du curseur dans le document HTML (scroll compris) **/
			var pos_X_cursor_page_px = e.pageX;
			var pos_Y_cursor_page_px = e.pageY;
			
			/** Déterminer la position absolute du document SVG **/
			var SVG_offsetLeft = 0;
			var SVG_offsetTop = 0;
			var obj = SVG;
			
			if(obj.offsetParent){
				do{
					SVG_offsetLeft += obj.offsetLeft;
					SVG_offsetTop += obj.offsetTop;
				} while (obj = obj.offsetParent);
			}
			
			/** Déterminer la position du curseur dans le document SVG **/
			var pos_X_cursor_SVG_px = pos_X_cursor_page_px - SVG_offsetLeft;
			var pos_Y_cursor_SVG_px = pos_Y_cursor_page_px - SVG_offsetTop;
			
			/** Determiner la position du curseur en % par rapport aux dimensions du SVG **/ 
			var pos_X_cursor_SVG_pc = (pos_X_cursor_SVG_px * 100) / parseFloat(SVG.getAttribute('width'));
			var pos_Y_cursor_SVG_pc = (pos_Y_cursor_SVG_px * 100) / parseFloat(SVG.getAttribute('height'));
			
			/** Récupérer la currentScale et les proportions du document **/
			var current_scale = SVG.getAttribute('currentScale');
			var document = SVG.getAttribute('document').split(' ').map(parseFloat);
			var document_width = document[0];
			var document_height = document[1];
			
			/** Déterminer les coordonées en % du pixel ciblé [Avant zoom pour reférence] **/
			// On connait la position relative du curseur dans le SVG reflétant la viewBox
			// On cherche les dimensions de la viewBox pour en connaitre la proportions du document
			// On cherche la part du curseur dans la viewBox
			// On l'ajoutera au coordonnée relative de la viewBox
			var vB = SVG.getAttribute('viewBox').split(' ').map(parseFloat);
			
			var vB_pos_X = vB[0];
			var vB_pos_Y = vB[1];
			var vB_width = vB[2];
			var vB_height = vB[3];
			
			/** Part en pourcent du document **/
			var vB_width_pc = (vB_width * 100) / document_width;
			var vB_height_pc = (vB_height * 100) / document_height;
				
			/** Position en pourcent de Document connu via la viewBox **/
			var pos_X_cursor_vB_pc = (pos_X_cursor_SVG_pc / 100) * vB_width_pc;
			var pos_Y_cursor_vB_pc = (pos_Y_cursor_SVG_pc / 100) * vB_height_pc;
			
			//var vB_pos_X_pc = (vB_pos_X * 100) / document_width;
			//var vB_pos_Y_pc = (vB_pos_X * 100) / document_height;
			
			var abs_pos_X_cursor = vB_pos_X + ((pos_X_cursor_vB_pc / 100) * document_width);
			var abs_pos_Y_cursor = vB_pos_Y + ((pos_Y_cursor_vB_pc / 100) * document_height);
			
			/** Calculer les données de la viewBox de sorte à ce que le pixel ciblé reste à sa place dans le view box (même proportion) **/
			/** Determiné le rapport de zoom **/
			if(e.wheelDelta > 100){
				var coef = 0.9;
				var facteur = 1;
			} else {
				var coef = 1.15;
				var facteur = 1;
			}
			
			
			/** Calculer les nouvelles dimensions de la viewBox **/
			vB[2] *= coef;
			vB[3] *= coef;
			
			/** Determiner la nouvelle part de la viewBox après zoom **/
			var new_vB_width_pc = (vB[2] * 100) / document_width;
			var new_vB_height_pc = (vB[3] * 100) / document_height;
			
			/** Nouvelle position en pourcent de Document connu via la viewBox **/
			//var new_pos_X_cursor_vB_pc = (pos_X_cursor_SVG_pc / 100) * new_vB_width_pc;
			//var new_pos_Y_cursor_vB_pc = (pos_Y_cursor_SVG_pc / 100) * new_vB_height_pc;
			
			
			/** Nouveau paramètre de la viewBox : on se positionne sur le pixel et on retire la part observé **/
			vB[0] = abs_pos_X_cursor - (facteur * ((((pos_X_cursor_SVG_pc /100) * (vB_width_pc * coef)) / 100) * document_width));
			vB[1] = abs_pos_Y_cursor - (facteur * ((((pos_Y_cursor_SVG_pc /100) * (vB_height_pc * coef)) / 100) * document_height));
			
			SVG.setAttribute('viewBox', vB.map(
				function(el){
					
					var decimal_round = 4;
					
					el = String(el);
					var dotIndex = el.lastIndexOf('.');
					
					if(dotIndex > 0){
						// Position du point + arrondis + 1 (le point est compté)
						el = el.substr(0, (dotIndex + decimal_round +1));
					}
					
					return parseFloat(el);
				}
			).join(' '));
			
			/** Empêcher le scrolling de la page **/
			e.preventDefault();
		}
	};
	
	/** Méthode de navigation dans le document **/
	self.pan = function(SVG, e){
		
		/** Gérer l'état du curseur **/
		self.isControllable(SVG, e);
		
		/** Si le SVG est maintenu et controllable, alors bouger **/
		if(self.controllable && self.handled){
			e.preventDefault();
			
			/** Déterminer la position du curseur dans le document HTML (scroll compris) **/
			var pos_X_cursor_page_px = e.pageX;
			var pos_Y_cursor_page_px = e.pageY;
			
			/** Déterminer la position absolute du document SVG **/
			var SVG_offsetLeft = 0;
			var SVG_offsetTop = 0;
			var obj = SVG;
			
			if(obj.offsetParent){
				do{
					SVG_offsetLeft += obj.offsetLeft;
					SVG_offsetTop += obj.offsetTop;
				} while (obj = obj.offsetParent);
			}
			
			/** Déterminer la position du curseur dans le document SVG **/
			var last_pos_X_cursor_SVG_px = self.lastX;
			var last_pos_Y_cursor_SVG_px = self.lastY;
			
			var pos_X_cursor_SVG_px = pos_X_cursor_page_px - SVG_offsetLeft;
			var pos_Y_cursor_SVG_px = pos_Y_cursor_page_px - SVG_offsetTop;
			
			/** Si les derniere coord sont null, enregistrer et stopper **/
			if(self.lastX === null && self.lastY === null){
				self.lastX = pos_X_cursor_SVG_px;
				self.lastY = pos_Y_cursor_SVG_px;
				return false;
			}
			
			/** Enregistrer en guise de valeur de référence **/
			self.lastX = pos_X_cursor_SVG_px;
			self.lastY = pos_Y_cursor_SVG_px;
			
			
			/** Determiner la position du curseur en % par rapport aux dimensions du SVG **/ 
			var pos_X_cursor_SVG_pc = (pos_X_cursor_SVG_px * 100) / parseFloat(SVG.getAttribute('width'));
			var pos_Y_cursor_SVG_pc = (pos_Y_cursor_SVG_px * 100) / parseFloat(SVG.getAttribute('height'));
			
			var last_pos_X_cursor_SVG_pc = (last_pos_X_cursor_SVG_px * 100) / parseFloat(SVG.getAttribute('width'));
			var last_pos_Y_cursor_SVG_pc = (last_pos_Y_cursor_SVG_px * 100) / parseFloat(SVG.getAttribute('height'));
			
			/** Récupérer la currentScale et les proportions du document **/
			//var current_scale = SVG.getAttribute('currentScale');
			var document = SVG.getAttribute('document').split(' ').map(parseFloat);
			var document_width = document[0];
			var document_height = document[1];
			
			/** Déterminer les coordonées en % du pixel ciblé [Avant zoom pour reférence] **/
			// On connait la position relative du curseur dans le SVG reflétant la viewBox
			// On cherche les dimensions de la viewBox pour en connaitre la proportions du document
			// On cherche la part du curseur dans la viewBox
			// On l'ajoutera au coordonnée relative de la viewBox
			var vB = SVG.getAttribute('viewBox').split(' ').map(parseFloat);
			
			var vB_pos_X = vB[0];
			var vB_pos_Y = vB[1];
			var vB_width = vB[2];
			var vB_height = vB[3];
			
			/** Part en pourcent du document **/
			var vB_width_pc = (vB_width * 100) / document_width;
			var vB_height_pc = (vB_height * 100) / document_height;
				
			/** Position en pourcent de Document connu via la viewBox **/
			var pos_X_cursor_vB_pc = (pos_X_cursor_SVG_pc / 100) * vB_width_pc;
			var pos_Y_cursor_vB_pc = (pos_Y_cursor_SVG_pc / 100) * vB_height_pc;
			
			var last_pos_X_cursor_vB_pc = (last_pos_X_cursor_SVG_pc / 100) * vB_width_pc;
			var last_pos_Y_cursor_vB_pc = (last_pos_Y_cursor_SVG_pc / 100) * vB_height_pc;
			
			//var vB_pos_X_pc = (vB_pos_X * 100) / document_width;
			//var vB_pos_Y_pc = (vB_pos_X * 100) / document_height;
			
			var abs_pos_X_cursor = vB_pos_X + ((pos_X_cursor_vB_pc / 100) * document_width);
			var abs_pos_Y_cursor = vB_pos_Y + ((pos_Y_cursor_vB_pc / 100) * document_height);
			
			/** Calculer le delta entre les deux position, la précédent et l'actuelle **/
			var delta_X_pc = pos_X_cursor_vB_pc - last_pos_X_cursor_vB_pc;
			var delta_Y_pc = pos_Y_cursor_vB_pc - last_pos_Y_cursor_vB_pc;
			
			/** Calculer le mouvement par rapport au document **/
			var delta_X_document = (delta_X_pc / 100) * document_width;
			var delta_Y_document = (delta_Y_pc / 100) * document_height;
			
			/** Imputer ce delta à X et Y de la viewBox vB en guise de déplacement **/
			vB[0] = vB[0] - delta_X_document;
			vB[1] = vB[1] - delta_Y_document;
			
			/** Mise à jour de l'attribut viewBox **/
			SVG.setAttribute('viewBox', vB.join(' '));
			
			/** Empêcher toute action prévu par défault **/
			//e.preventDefault();
		}
	};
	
	/** Méthode pour indiquer que le SVG est maintenu (handled) **/
	self.handle = function(e){
		self.handled = true;
	};
	
	/** Méthode pour indiquer que le SVG est relaché (released) **/
	self.release = function(e){
		self.handled = false;
		
		/** Reset au relaché sinon, lors de la reprise, il utilise la dernière référence **/
		self.lastX = null;
		self.lastY = null;
	};
	
	/** Méthode de remise à zéro du SVG par double click **/
	self.reset = function(SVG, e){
		if(e.ctrlKey){
			var document = SVG.getAttribute('document').split(' ');
			var vB = [0, 0, document[0], document[1]];
			
			SVG.setAttribute('viewBox', vB.join(' '));
		}
			
		e.preventDefault();
	};
	
	/** Méthode d'enregistrement de règle CSS **/
	self.recordRule = function(){
		if(!self.CSSRuleRecorded){
			if(document.styleSheets.length <= 0){
				var styleSheet = document.createElement('style');
				document.head.appendChild(styleSheet);
			}
			
			var lastStyleSheetIndex = document.styleSheets.length - 1;
			
			var cssRule_1 = '.MySVGPan_controllable {cursor: crosshair;}';
			
			document.styleSheets[lastStyleSheetIndex].insertRule(cssRule_1, document.styleSheets[lastStyleSheetIndex].cssRules.length);
		}
	};
	
	/** Méthode de gestion du curseur du SVG **/
	self.isControllable = function(SVG, e){
		if(self.controllable !== e.ctrlKey){
			if(e.ctrlKey){
				SVG.classList.add('MySVGPan_controllable');
			} else {
				SVG.classList.remove('MySVGPan_controllable');
			}
			
			self.controllable = e.ctrlKey;
		}
	};
	
	
	/** -------------------------------------------------------------------------------------------------------------------- **
	/** ---																																					--- **
	/** ---													Execution interne de l'instance														--- **
	/** ---																																					--- **
	/** -------------------------------------------------------------------------------------------------------------------- **/
}


/** -------------------------------------------------------------------------------------------------------------------- **
/** ---																																					--- **
/** ---																	Autoload																		--- **
/** ---																																					--- **
/** -------------------------------------------------------------------------------------------------------------------- **/
var SVGPan = new SVGPanEngine();

document.addEventListener('readystatechange', SVGPan.init.bind(SVGPan));
