var diffJs = {

  __whitespace: {
    ' ':true,
    '\t':true,
    '\n':true,
    '\f':true,
    '\r':true
  },

  __hasOwnProperty: function(obj, target){
    return Object.prototype.hasOwnProperty.call(obj, target);
  },

	__ntuplecomp: function (a, b) {
		var mlen = Math.max(a.length, b.length);
		for (var i = 0; i < mlen; i++) {
			if (a[i] < b[i]) {
        return -1;
      }
			if (a[i] > b[i]) {
        return 1;
      }
		}

		return a.length === b.length ? 0 : (a.length < b.length ? -1 : 1);
	},

	__isIndict: function (dict) {
		return function (key) {
      return diffJs.__hasOwnProperty(dict, key);
    };
	},

	__dictGet: function (dict, key, defaultValue) {
		return diffJs.__hasOwnProperty(dict, key) ? dict[key] : defaultValue;
	},

  defaultJunkFunction: function (c) {
    return diffJs.__hasOwnProperty(diffJs.__whitespace, c);
  },

  stripLinebreaks: function (str) {
    return str.replace(/^[\n\r]*|[\n\r]*$/g, '');
  },

  stringAsLines: function (str) {
    var lfpos = str.indexOf('\n');
    var crpos = str.indexOf('\r');
    var linebreak = ((lfpos > -1 && crpos > -1) || crpos < 0) ? '\n' : '\r';

    var lines = str.split(linebreak);
    for (var i = 0; i < lines.length; i++) {
      lines[i] = diffJs.stripLinebreaks(lines[i]);
    }

    return lines;
  },

	sequenceMatcher: function (a, b, isJunk) {
		this.set_seqs = function (a, b) {
			this.setSeq1(a);
			this.setSeq2(b);
		};

		this.setSeq1 = function (a) {
			if (a === this.a) {
        return;
      }
			this.a = a;
			this.matchingBlocks = this.opCodes = null;
		};

		this.setSeq2 = function (b) {
			if (b === this.b) {
        return;
      }
			this.b = b;
			this.matchingBlocks = this.opCodes = null;
			this.__chainB();
		};

		this.__chainB = function () {
			var b = this.b;
			var n = b.length;
			var b2j = this.b2j = {};
			var popularDict = {};
			for (var i = 0; i < b.length; i++) {
				var elt = b[i];
				if (diffJs.__hasOwnProperty(b2j, elt)) {
					var indices = b2j[elt];
					if (n >= 200 && indices.length * 100 > n) {
						popularDict[elt] = 1;
						delete b2j[elt];
					} else {
						indices.push(i);
					}
				} else {
					b2j[elt] = [i];
				}
			}

			for (var dict in popularDict) {
				if (diffJs.__hasOwnProperty(popularDict, dict)) {
					delete b2j[dict];
				}
			}

			var isJunk = this.isJunk;
			var junkDict = {};
			if (isJunk) {
				for (var dictJunk in popularDict) {
					if (diffJs.__hasOwnProperty(popularDict, dictJunk) && isJunk(dictJunk)) {
						junkDict[dictJunk] = 1;
						delete popularDict[dictJunk];
					}
				}
				for (var dictB2 in b2j) {
					if (diffJs.__hasOwnProperty(b2j, dictB2) && isJunk(dictB2)) {
						junkDict[dictB2] = 1;
						delete b2j[dictB2];
					}
				}
			}

			this.isBJunk = diffJs.__isIndict(junkDict);
		};

		this.findLongestMatch = function (alo, ahi, blo, bhi) {
			var a = this.a;
			var b = this.b;
			var b2j = this.b2j;
			var isBJunk = this.isBJunk;
			var besti = alo;
			var bestj = blo;
			var bestsize = 0;
			var j = null;
			var k;

			var j2len = {};
			var nothing = [];
			for (var i = alo; i < ahi; i++) {
				var newj2len = {};
				var jdict = diffJs.__dictGet(b2j, a[i], nothing);
				for (var jkey in jdict) {
					if (diffJs.__hasOwnProperty(jdict, jkey)) {
						j = jdict[jkey];
						if (j < blo) {
              continue;
            }
						if (j >= bhi) {
              break;
            }

            newj2len[j] = k = diffJs.__dictGet(j2len, j - 1, 0) + 1;

            if (k > bestsize) {
							besti = i - k + 1;
							bestj = j - k + 1;
							bestsize = k;
						}
					}
				}
				j2len = newj2len;
			}

			while (besti > alo && bestj > blo && !isBJunk(b[bestj - 1]) && a[besti - 1] === b[bestj - 1]) {
				besti--;
				bestj--;
				bestsize++;
			}

			while (besti + bestsize < ahi && bestj + bestsize < bhi && !isBJunk(b[bestj + bestsize]) && a[besti + bestsize] === b[bestj + bestsize]) {
				bestsize++;
			}

			while (besti > alo && bestj > blo && isBJunk(b[bestj - 1]) && a[besti - 1] === b[bestj - 1]) {
				besti--;
				bestj--;
				bestsize++;
			}

			while (besti + bestsize < ahi && bestj + bestsize < bhi && isBJunk(b[bestj + bestsize]) && a[besti + bestsize] === b[bestj + bestsize]) {
				bestsize++;
			}

			return [besti, bestj, bestsize];
		};

		this.getMatchingBlocks = function () {
			if (this.matchingBlocks !== null) {
        return this.matchingBlocks;
      }

			var la = this.a.length;
			var lb = this.b.length;

			var queue = [[0, la, 0, lb]];
			var matchingBlocks = [];
			var alo, ahi, blo, bhi, qi, i, j, k, x;

			while (queue.length) {
				qi = queue.pop();
				alo = qi[0];
				ahi = qi[1];
				blo = qi[2];
				bhi = qi[3];
				x = this.findLongestMatch(alo, ahi, blo, bhi);
				i = x[0];
				j = x[1];
				k = x[2];

				if (k) {
					matchingBlocks.push(x);
					if (alo < i && blo < j) {
            queue.push([alo, i, blo, j]);
          }
					if (i+k < ahi && j+k < bhi) {
            queue.push([i + k, ahi, j + k, bhi]);
          }
				}
			}

			matchingBlocks.sort(diffJs.__ntuplecomp);

			var i1 = 0, j1 = 0, k1 = 0, block = 0;
			var i2, j2, k2;
			var nonAdjacent = [];

      for (var idx in matchingBlocks) {
				if (diffJs.__hasOwnProperty(matchingBlocks, idx)) {

          block = matchingBlocks[idx];
					i2 = block[0];
					j2 = block[1];
					k2 = block[2];

					if (i1 + k1 === i2 && j1 + k1 === j2) {
						k1 += k2;
					} else {
						if (k1) {
              nonAdjacent.push([i1, j1, k1]);
            }
						i1 = i2;
						j1 = j2;
						k1 = k2;
					}
				}
			}

			if (k1) {
        nonAdjacent.push([i1, j1, k1]);
      }

			nonAdjacent.push([la, lb, 0]);
			this.matchingBlocks = nonAdjacent;
			return this.matchingBlocks;
		};

		this.getOpCodes = function () {
			if (this.opCodes !== null) {
        return this.opCodes;
      }

      var i = 0;
			var j = 0;
			var answer = [];
			this.opCodes = answer;
			var block, ai, bj, size, tag;
			var blocks = this.getMatchingBlocks();

      for (var idx in blocks) {
				if (diffJs.__hasOwnProperty(blocks, idx)) {
					block = blocks[idx];
					ai = block[0];
					bj = block[1];
					size = block[2];
					tag = '';

          if (i < ai && j < bj) {
						tag = 'replace';
					} else if (i < ai) {
						tag = 'delete';
					} else if (j < bj) {
						tag = 'insert';
					}

          if (tag) {
            answer.push([tag, i, ai, j, bj]);
          }

          i = ai + size;
					j = bj + size;

					if (size) {
            answer.push(['equal', ai, i, bj, j]);
          }
				}
			}

			return answer;
		};

		this.isJunk = isJunk ? isJunk : diffJs.defaultJunkFunction;
		this.a = this.b = null;
		this.set_seqs(a, b);
	},
  render: function (params) {

    var targetElement = (typeof params.targetElement !== 'undefined') ? params.targetElement : null;
    var oldText = (typeof params.oldText !== 'undefined') ? diffJs.stringAsLines(params.oldText) : null;
    var newText = (typeof params.newText !== 'undefined') ? diffJs.stringAsLines(params.newText) : null;
    var oldTextLabel = (typeof params.oldTextLabel !== 'undefined') ? params.oldTextLabel : 'Old Text';
    var newTextLabel = (typeof params.newTextLabel !== 'undefined') ? params.newTextLabel : 'New Text';
    var cutOffSize = (typeof params.cutOffSize !== 'undefined') ? params.cutOffSize : 2;
    var layout = (typeof params.layout !== 'undefined') ? params.layout : 'unified';
    var diffWords = (typeof params.diffWords !== 'undefined') ? params.diffWords : true;
    var footerText = (typeof params.footerText !== 'undefined') ? params.footerText : '';

    var sm = new diffJs.sequenceMatcher(oldText, newText);
    var opCodes = sm.getOpCodes();

    if (oldText === null) {
      throw 'Cannot build diff view; oldText is not defined.';
    }
    if (newText === null) {
      throw 'Cannot build diff view; newText is not defined.';
    }
    if ( !opCodes) {
      throw 'Cannot build diff view; opCodes is not defined.';
    }

    function celt (name, className) {
      var e = document.createElement(name);
      e.className = className;
      return e;
    }

    function telt (name, text, className) {
      var e = document.createElement(name);
      e.className = className;
      e.appendChild(document.createTextNode(text));
      return e;
    }

    function ctelt (name, className, text, colSpan) {
      var e = document.createElement(name);
      e.className = className;

      if(colSpan){
        e.setAttribute('colSpan', colSpan);
      }

      e.appendChild(document.createTextNode(text));
      return e;
    }

    function ctel (name, className, node) {
      var e = document.createElement(name);
      e.className = className;
      e.appendChild(node);
      return e;
    }

    var tdata = document.createElement('thead');
    var node = document.createElement('tr');

    tdata.appendChild(node);

    if (layout === 'unified') {
      node.appendChild(ctelt('th', 'texttitle', oldTextLabel + ' vs. ' + newTextLabel, 3));
    } else {
      node.appendChild(document.createElement('th'));
      node.appendChild(ctelt('th', 'texttitle', oldTextLabel));
      node.appendChild(document.createElement('th'));
      node.appendChild(ctelt('th', 'texttitle', newTextLabel));
    }

    tdata = [tdata];

    var rows = [];
    var node2;

    function addCells (row, tidx, tend, textLines, change) {
      if (tidx < tend) {
        row.appendChild(telt('th', (tidx + 1).toString(), change));
        row.appendChild(ctelt('td', change, textLines[tidx].replace(/\t/g, '\u00a0\u00a0\u00a0\u00a0')));
        return tidx + 1;
      } else {
        row.appendChild(document.createElement('th'));
        row.appendChild(celt('td', 'empty'));
        return tidx;
      }
    }

    function addCellsInline (row, tidx, tidx2, textLines, change) {
      row.appendChild(telt('th', tidx === null ? '' : (tidx + 1).toString(), change));
      row.appendChild(telt('th', tidx2 === null ? '' : (tidx2 + 1).toString(), change));
      row.appendChild(ctelt('td', change, textLines[tidx !== null ? tidx : tidx2].replace(/\t/g, '\u00a0\u00a0\u00a0\u00a0')));
    }

    function addCellsNode (row, tidx, tidx2, node, change) {
      row.appendChild(telt('th', tidx === null ? '' : (tidx + 1).toString(), change));
      row.appendChild(telt('th', tidx2 === null ? '' : (tidx2 + 1).toString(), change));
      row.appendChild(ctel('td', change, node));
    }

    for (var idx = 0; idx < opCodes.length; idx++) {
      var code = opCodes[idx];
      var change = code[0];
      var b = code[1];
      var be = code[2];
      var n = code[3];
      var ne = code[4];
      var rowcnt = Math.max(be - b, ne - n);
      var toprows = [];
      var botrows = [];
      for (var i = 0; i < rowcnt; i++) {
        if (cutOffSize && opCodes.length > 1 && ((idx > 0 && i === cutOffSize) || (idx === 0 && i === 0)) && change === 'equal') {
          var jump = rowcnt - ((idx === 0 ? 1 : 2) * cutOffSize);
          if (jump > 1) {
            toprows.push(node = document.createElement('tr'));

            b += jump;
            n += jump;
            i += jump - 1;

            node.appendChild(telt('th', '...', 'skip'));

            if (layout !== 'unified') {
              node.appendChild(ctelt('td', 'skip', ''));
            }

            node.appendChild(telt('th', '...', 'skip'));
            node.appendChild(ctelt('td', 'skip', ''));

            if (idx + 1 === opCodes.length) {
              break;
            } else {
              continue;
            }
          }
        }

        toprows.push(node = document.createElement('tr'));
        if (layout === 'unified') {
          if (change === 'insert') {
            addCellsInline(node, null, n++, newText, change);
          } else if (change === 'replace') {
            botrows.push(node2 = document.createElement('tr'));

            if (diffWords) {

              var baseTextLine = oldText[b];
              var newTextLine = newText[n];
              var wordrule = /\b/;
              var bw = baseTextLine.split(wordrule);
              var nw = newTextLine.split(wordrule);
              var wsm = new diffJs.sequenceMatcher(bw, nw);
              var wopCodes = wsm.getOpCodes();
              var bnode = document.createElement('span');
              var nnode = document.createElement('span');
              for (var k = 0; k < wopCodes.length; k++) {
                var wcode = wopCodes[k];
                var wchange = wcode[0];
                var wb = wcode[1];
                var wbe = wcode[2];
                var wn = wcode[3];
                var wne = wcode[4];
                var wcnt = Math.max(wbe - wb, wne - wn);
                for (var m = 0; m < wcnt; m++) {
                  if (wchange === 'insert') {
                    nnode.appendChild(ctelt('ins', 'diff', nw[wn++]));
                  } else if (wchange === 'replace') {
                    if (wb < wbe) {
                      bnode.appendChild(ctelt('del', 'diff', bw[wb++]));
                    }
                    if (wn < wne) {
                      nnode.appendChild(ctelt('ins', 'diff', nw[wn++]));
                    }
                  } else if (wchange === 'delete') {
                    bnode.appendChild(ctelt('del', 'diff', bw[wb++]));
                  } else {
                    bnode.appendChild(ctelt('span', wchange, bw[wb]));
                    nnode.appendChild(ctelt('span', wchange, bw[wb++]));
                  }
                }
              }

              if (b < be) {
                addCellsNode(node, b++, null, bnode, 'delete');
              }
              if (n < ne) {
                addCellsNode(node2, null, n++, nnode, 'insert');
              }
            } else {
              if (b < be) {
                addCellsInline(node, b++, null, oldText, 'delete');
              }
              if (n < ne) {
                addCellsInline(node2, null, n++, newText, 'insert');
              }
            }
          } else if (change === 'delete') {
            addCellsInline(node, b++, null, oldText, change);
          } else {
            addCellsInline(node, b++, n++, oldText, change);
          }
        } else {

          b = addCells(node, b, be, oldText, change);
          n = addCells(node, n, ne, newText, change);
        }
      }

      for (var tr = 0; tr < toprows.length; tr++) {
        rows.push(toprows[tr]);
      }
      for (var br = 0; br < botrows.length; br++){
        rows.push(botrows[br]);
      }
    }

    rows.push(node = ctelt('th', 'options', footerText));
    node.setAttribute("colspan", (layout === 'unified') ? 3 : 4);

    var unifiedElm, splitElm;

    node.appendChild(unifiedElm = telt('a', 'unified'));
    unifiedElm.className = (layout === 'unified') ? 'selected' : '';
    unifiedElm.onclick = function(){
      params.layout = 'unified';

      if(params.onLayoutChange && typeof params.onLayoutChange === 'function') {
        params.onLayoutChange();
      }

      diffJs.render(params);
    };

    node.appendChild(splitElm = telt('a', 'split'));
    splitElm.className = (layout === 'split') ? 'selected' : '';
    splitElm.onclick = function(){
      params.layout = 'split';

      if(params.onLayoutChange && typeof params.onLayoutChange === 'function') {
        params.onLayoutChange();
      }

      diffJs.render(params);
    };

    tdata.push(node = document.createElement('tbody'));
    for (var row in rows) {
      if(diffJs.__hasOwnProperty(rows, row)){
        node.appendChild(rows[row]);
      }
    }

    node = celt('table', 'diff' + (layout === 'unified' ? ' unified' : ' split'));
    for (var data in tdata) {
      if(diffJs.__hasOwnProperty(tdata, data)){
        node.appendChild(tdata[data]);
      }
    }

    if(targetElement){
      targetElement.innerHTML = '';
      targetElement.appendChild(node);
    } else {
      return node;
    }
  }
};

