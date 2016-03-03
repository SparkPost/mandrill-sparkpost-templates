/* istanbul ignore next */
/* Jison generated parser */
var handlebars = (function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"root":3,"program":4,"EOF":5,"program_repetition0":6,"statement":7,"mustache":8,"block":9,"rawBlock":10,"partial":11,"partialBlock":12,"content":13,"COMMENT":14,"CONTENT":15,"openRawBlock":16,"rawBlock_repetition_plus0":17,"END_RAW_BLOCK":18,"OPEN_RAW_BLOCK":19,"helperName":20,"openRawBlock_repetition0":21,"openRawBlock_option0":22,"CLOSE_RAW_BLOCK":23,"openBlock":24,"block_option0":25,"closeBlock":26,"openInverse":27,"block_option1":28,"OPEN_BLOCK":29,"openBlock_repetition0":30,"openBlock_option0":31,"openBlock_option1":32,"CLOSE":33,"OPEN_INVERSE":34,"openInverse_repetition0":35,"openInverse_option0":36,"openInverse_option1":37,"openInverseChain":38,"OPEN_INVERSE_CHAIN":39,"openInverseChain_repetition0":40,"openInverseChain_option0":41,"openInverseChain_option1":42,"inverseAndProgram":43,"INVERSE":44,"inverseChain":45,"inverseChain_option0":46,"OPEN_ENDBLOCK":47,"OPEN":48,"mustache_repetition0":49,"mustache_option0":50,"OPEN_UNESCAPED":51,"mustache_repetition1":52,"mustache_option1":53,"CLOSE_UNESCAPED":54,"OPEN_PARTIAL":55,"partialName":56,"partial_repetition0":57,"partial_option0":58,"openPartialBlock":59,"OPEN_PARTIAL_BLOCK":60,"openPartialBlock_repetition0":61,"openPartialBlock_option0":62,"param":63,"sexpr":64,"OPEN_SEXPR":65,"sexpr_repetition0":66,"sexpr_option0":67,"CLOSE_SEXPR":68,"hash":69,"hash_repetition_plus0":70,"hashSegment":71,"ID":72,"EQUALS":73,"blockParams":74,"OPEN_BLOCK_PARAMS":75,"blockParams_repetition_plus0":76,"CLOSE_BLOCK_PARAMS":77,"path":78,"dataName":79,"STRING":80,"EXPRESSION":81,"NUMBER":82,"BOOLEAN":83,"UNDEFINED":84,"NULL":85,"DATA":86,"pathSegments":87,"SEP":88,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",14:"COMMENT",15:"CONTENT",18:"END_RAW_BLOCK",19:"OPEN_RAW_BLOCK",23:"CLOSE_RAW_BLOCK",29:"OPEN_BLOCK",33:"CLOSE",34:"OPEN_INVERSE",39:"OPEN_INVERSE_CHAIN",44:"INVERSE",47:"OPEN_ENDBLOCK",48:"OPEN",51:"OPEN_UNESCAPED",54:"CLOSE_UNESCAPED",55:"OPEN_PARTIAL",60:"OPEN_PARTIAL_BLOCK",65:"OPEN_SEXPR",68:"CLOSE_SEXPR",72:"ID",73:"EQUALS",75:"OPEN_BLOCK_PARAMS",77:"CLOSE_BLOCK_PARAMS",80:"STRING",81:"EXPRESSION",82:"NUMBER",83:"BOOLEAN",84:"UNDEFINED",85:"NULL",86:"DATA",88:"SEP"},
productions_: [0,[3,2],[4,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[13,1],[10,3],[16,5],[9,4],[9,4],[24,6],[27,6],[38,6],[43,2],[45,3],[45,1],[26,3],[8,5],[8,5],[11,5],[12,3],[59,5],[63,1],[63,1],[64,5],[69,1],[71,3],[74,3],[20,1],[20,1],[20,1],[20,1],[20,1],[20,1],[20,1],[20,1],[56,1],[56,1],[79,2],[78,1],[87,3],[87,1],[6,0],[6,2],[17,1],[17,2],[21,0],[21,2],[22,0],[22,1],[25,0],[25,1],[28,0],[28,1],[30,0],[30,2],[31,0],[31,1],[32,0],[32,1],[35,0],[35,2],[36,0],[36,1],[37,0],[37,1],[40,0],[40,2],[41,0],[41,1],[42,0],[42,1],[46,0],[46,1],[49,0],[49,2],[50,0],[50,1],[52,0],[52,2],[53,0],[53,1],[57,0],[57,2],[58,0],[58,1],[61,0],[61,2],[62,0],[62,1],[66,0],[66,2],[67,0],[67,1],[70,1],[70,2],[76,1],[76,2]],
performAction: function anonymous(yytext,yyleng,yylineno,yy,yystate,$$,_$
/**/) {

var $0 = $$.length - 1;
switch (yystate) {
case 1: return $$[$0-1]; 
break;
case 2:this.$ = yy.prepareProgram($$[$0]);
break;
case 3:this.$ = $$[$0];
break;
case 4:this.$ = $$[$0];
break;
case 5:this.$ = $$[$0];
break;
case 6:this.$ = $$[$0];
break;
case 7:this.$ = $$[$0];
break;
case 8:this.$ = $$[$0];
break;
case 9:
    this.$ = {
      type: 'CommentStatement',
      value: yy.stripComment($$[$0]),
      strip: yy.stripFlags($$[$0], $$[$0]),
      loc: yy.locInfo(this._$)
    };
  
break;
case 10:
    this.$ = {
      type: 'ContentStatement',
      original: $$[$0],
      value: $$[$0],
      loc: yy.locInfo(this._$)
    };
  
break;
case 11:this.$ = yy.prepareRawBlock($$[$0-2], $$[$0-1], $$[$0], this._$);
break;
case 12:this.$ = { path: $$[$0-3], params: $$[$0-2], hash: $$[$0-1] };
break;
case 13:this.$ = yy.prepareBlock($$[$0-3], $$[$0-2], $$[$0-1], $$[$0], false, this._$);
break;
case 14:this.$ = yy.prepareBlock($$[$0-3], $$[$0-2], $$[$0-1], $$[$0], true, this._$);
break;
case 15:this.$ = { open: $$[$0-5], path: $$[$0-4], params: $$[$0-3], hash: $$[$0-2], blockParams: $$[$0-1], strip: yy.stripFlags($$[$0-5], $$[$0]) };
break;
case 16:this.$ = { path: $$[$0-4], params: $$[$0-3], hash: $$[$0-2], blockParams: $$[$0-1], strip: yy.stripFlags($$[$0-5], $$[$0]) };
break;
case 17:this.$ = { path: $$[$0-4], params: $$[$0-3], hash: $$[$0-2], blockParams: $$[$0-1], strip: yy.stripFlags($$[$0-5], $$[$0]) };
break;
case 18:this.$ = { strip: yy.stripFlags($$[$0-1], $$[$0-1]), program: $$[$0] };
break;
case 19:
    var inverse = yy.prepareBlock($$[$0-2], $$[$0-1], $$[$0], $$[$0], false, this._$),
        program = yy.prepareProgram([inverse], $$[$0-1].loc);
    program.chained = true;

    this.$ = { strip: $$[$0-2].strip, program: program, chain: true };
  
break;
case 20:this.$ = $$[$0];
break;
case 21:this.$ = {path: $$[$0-1], strip: yy.stripFlags($$[$0-2], $$[$0])};
break;
case 22:this.$ = yy.prepareMustache($$[$0-3], $$[$0-2], $$[$0-1], $$[$0-4], yy.stripFlags($$[$0-4], $$[$0]), this._$);
break;
case 23:this.$ = yy.prepareMustache($$[$0-3], $$[$0-2], $$[$0-1], $$[$0-4], yy.stripFlags($$[$0-4], $$[$0]), this._$);
break;
case 24:
    this.$ = {
      type: 'PartialStatement',
      name: $$[$0-3],
      params: $$[$0-2],
      hash: $$[$0-1],
      indent: '',
      strip: yy.stripFlags($$[$0-4], $$[$0]),
      loc: yy.locInfo(this._$)
    };
  
break;
case 25:this.$ = yy.preparePartialBlock($$[$0-2], $$[$0-1], $$[$0], this._$);
break;
case 26:this.$ = { path: $$[$0-3], params: $$[$0-2], hash: $$[$0-1], strip: yy.stripFlags($$[$0-4], $$[$0]) };
break;
case 27:this.$ = $$[$0];
break;
case 28:this.$ = $$[$0];
break;
case 29:
    this.$ = {
      type: 'SubExpression',
      path: $$[$0-3],
      params: $$[$0-2],
      hash: $$[$0-1],
      loc: yy.locInfo(this._$)
    };
  
break;
case 30:this.$ = {type: 'Hash', pairs: $$[$0], loc: yy.locInfo(this._$)};
break;
case 31:this.$ = {type: 'HashPair', key: yy.id($$[$0-2]), value: $$[$0], loc: yy.locInfo(this._$)};
break;
case 32:this.$ = yy.id($$[$0-1]);
break;
case 33:this.$ = $$[$0];
break;
case 34:this.$ = $$[$0];
break;
case 35:this.$ = {type: 'StringLiteral', value: $$[$0], original: $$[$0], loc: yy.locInfo(this._$)};
break;
case 36:this.$ = {type: 'ExprLiteral', value: $$[$0], original: $$[$0], loc: yy.locInfo(this._$)};
break;
case 37:this.$ = {type: 'NumberLiteral', value: Number($$[$0]), original: Number($$[$0]), loc: yy.locInfo(this._$)};
break;
case 38:this.$ = {type: 'BooleanLiteral', value: $$[$0] === 'true', original: $$[$0] === 'true', loc: yy.locInfo(this._$)};
break;
case 39:this.$ = {type: 'UndefinedLiteral', original: undefined, value: undefined, loc: yy.locInfo(this._$)};
break;
case 40:this.$ = {type: 'NullLiteral', original: null, value: null, loc: yy.locInfo(this._$)};
break;
case 41:this.$ = $$[$0];
break;
case 42:this.$ = $$[$0];
break;
case 43:this.$ = yy.preparePath(true, $$[$0], this._$);
break;
case 44:this.$ = yy.preparePath(false, $$[$0], this._$);
break;
case 45: $$[$0-2].push({part: yy.id($$[$0]), original: $$[$0], separator: $$[$0-1]}); this.$ = $$[$0-2]; 
break;
case 46:this.$ = [{part: yy.id($$[$0]), original: $$[$0]}];
break;
case 47:this.$ = [];
break;
case 48:$$[$0-1].push($$[$0]);
break;
case 49:this.$ = [$$[$0]];
break;
case 50:$$[$0-1].push($$[$0]);
break;
case 51:this.$ = [];
break;
case 52:$$[$0-1].push($$[$0]);
break;
case 59:this.$ = [];
break;
case 60:$$[$0-1].push($$[$0]);
break;
case 65:this.$ = [];
break;
case 66:$$[$0-1].push($$[$0]);
break;
case 71:this.$ = [];
break;
case 72:$$[$0-1].push($$[$0]);
break;
case 79:this.$ = [];
break;
case 80:$$[$0-1].push($$[$0]);
break;
case 83:this.$ = [];
break;
case 84:$$[$0-1].push($$[$0]);
break;
case 87:this.$ = [];
break;
case 88:$$[$0-1].push($$[$0]);
break;
case 91:this.$ = [];
break;
case 92:$$[$0-1].push($$[$0]);
break;
case 95:this.$ = [];
break;
case 96:$$[$0-1].push($$[$0]);
break;
case 99:this.$ = [$$[$0]];
break;
case 100:$$[$0-1].push($$[$0]);
break;
case 101:this.$ = [$$[$0]];
break;
case 102:$$[$0-1].push($$[$0]);
break;
}
},
table: [{3:1,4:2,5:[2,47],6:3,14:[2,47],15:[2,47],19:[2,47],29:[2,47],34:[2,47],48:[2,47],51:[2,47],55:[2,47],60:[2,47]},{1:[3]},{5:[1,4]},{5:[2,2],7:5,8:6,9:7,10:8,11:9,12:10,13:11,14:[1,12],15:[1,20],16:17,19:[1,23],24:15,27:16,29:[1,21],34:[1,22],39:[2,2],44:[2,2],47:[2,2],48:[1,13],51:[1,14],55:[1,18],59:19,60:[1,24]},{1:[2,1]},{5:[2,48],14:[2,48],15:[2,48],19:[2,48],29:[2,48],34:[2,48],39:[2,48],44:[2,48],47:[2,48],48:[2,48],51:[2,48],55:[2,48],60:[2,48]},{5:[2,3],14:[2,3],15:[2,3],19:[2,3],29:[2,3],34:[2,3],39:[2,3],44:[2,3],47:[2,3],48:[2,3],51:[2,3],55:[2,3],60:[2,3]},{5:[2,4],14:[2,4],15:[2,4],19:[2,4],29:[2,4],34:[2,4],39:[2,4],44:[2,4],47:[2,4],48:[2,4],51:[2,4],55:[2,4],60:[2,4]},{5:[2,5],14:[2,5],15:[2,5],19:[2,5],29:[2,5],34:[2,5],39:[2,5],44:[2,5],47:[2,5],48:[2,5],51:[2,5],55:[2,5],60:[2,5]},{5:[2,6],14:[2,6],15:[2,6],19:[2,6],29:[2,6],34:[2,6],39:[2,6],44:[2,6],47:[2,6],48:[2,6],51:[2,6],55:[2,6],60:[2,6]},{5:[2,7],14:[2,7],15:[2,7],19:[2,7],29:[2,7],34:[2,7],39:[2,7],44:[2,7],47:[2,7],48:[2,7],51:[2,7],55:[2,7],60:[2,7]},{5:[2,8],14:[2,8],15:[2,8],19:[2,8],29:[2,8],34:[2,8],39:[2,8],44:[2,8],47:[2,8],48:[2,8],51:[2,8],55:[2,8],60:[2,8]},{5:[2,9],14:[2,9],15:[2,9],19:[2,9],29:[2,9],34:[2,9],39:[2,9],44:[2,9],47:[2,9],48:[2,9],51:[2,9],55:[2,9],60:[2,9]},{20:25,72:[1,36],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,33],86:[1,35],87:34},{20:37,72:[1,36],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,33],86:[1,35],87:34},{4:38,6:3,14:[2,47],15:[2,47],19:[2,47],29:[2,47],34:[2,47],39:[2,47],44:[2,47],47:[2,47],48:[2,47],51:[2,47],55:[2,47],60:[2,47]},{4:39,6:3,14:[2,47],15:[2,47],19:[2,47],29:[2,47],34:[2,47],44:[2,47],47:[2,47],48:[2,47],51:[2,47],55:[2,47],60:[2,47]},{13:41,15:[1,20],17:40},{20:43,56:42,64:44,65:[1,45],72:[1,36],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,33],86:[1,35],87:34},{4:46,6:3,14:[2,47],15:[2,47],19:[2,47],29:[2,47],34:[2,47],47:[2,47],48:[2,47],51:[2,47],55:[2,47],60:[2,47]},{5:[2,10],14:[2,10],15:[2,10],18:[2,10],19:[2,10],29:[2,10],34:[2,10],39:[2,10],44:[2,10],47:[2,10],48:[2,10],51:[2,10],55:[2,10],60:[2,10]},{20:47,72:[1,36],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,33],86:[1,35],87:34},{20:48,72:[1,36],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,33],86:[1,35],87:34},{20:49,72:[1,36],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,33],86:[1,35],87:34},{20:43,56:50,64:44,65:[1,45],72:[1,36],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,33],86:[1,35],87:34},{33:[2,79],49:51,65:[2,79],72:[2,79],80:[2,79],81:[2,79],82:[2,79],83:[2,79],84:[2,79],85:[2,79],86:[2,79]},{23:[2,33],33:[2,33],54:[2,33],65:[2,33],68:[2,33],72:[2,33],75:[2,33],80:[2,33],81:[2,33],82:[2,33],83:[2,33],84:[2,33],85:[2,33],86:[2,33]},{23:[2,34],33:[2,34],54:[2,34],65:[2,34],68:[2,34],72:[2,34],75:[2,34],80:[2,34],81:[2,34],82:[2,34],83:[2,34],84:[2,34],85:[2,34],86:[2,34]},{23:[2,35],33:[2,35],54:[2,35],65:[2,35],68:[2,35],72:[2,35],75:[2,35],80:[2,35],81:[2,35],82:[2,35],83:[2,35],84:[2,35],85:[2,35],86:[2,35]},{23:[2,36],33:[2,36],54:[2,36],65:[2,36],68:[2,36],72:[2,36],75:[2,36],80:[2,36],81:[2,36],82:[2,36],83:[2,36],84:[2,36],85:[2,36],86:[2,36]},{23:[2,37],33:[2,37],54:[2,37],65:[2,37],68:[2,37],72:[2,37],75:[2,37],80:[2,37],81:[2,37],82:[2,37],83:[2,37],84:[2,37],85:[2,37],86:[2,37]},{23:[2,38],33:[2,38],54:[2,38],65:[2,38],68:[2,38],72:[2,38],75:[2,38],80:[2,38],81:[2,38],82:[2,38],83:[2,38],84:[2,38],85:[2,38],86:[2,38]},{23:[2,39],33:[2,39],54:[2,39],65:[2,39],68:[2,39],72:[2,39],75:[2,39],80:[2,39],81:[2,39],82:[2,39],83:[2,39],84:[2,39],85:[2,39],86:[2,39]},{23:[2,40],33:[2,40],54:[2,40],65:[2,40],68:[2,40],72:[2,40],75:[2,40],80:[2,40],81:[2,40],82:[2,40],83:[2,40],84:[2,40],85:[2,40],86:[2,40]},{23:[2,44],33:[2,44],54:[2,44],65:[2,44],68:[2,44],72:[2,44],75:[2,44],80:[2,44],81:[2,44],82:[2,44],83:[2,44],84:[2,44],85:[2,44],86:[2,44],88:[1,52]},{72:[1,36],87:53},{23:[2,46],33:[2,46],54:[2,46],65:[2,46],68:[2,46],72:[2,46],75:[2,46],80:[2,46],81:[2,46],82:[2,46],83:[2,46],84:[2,46],85:[2,46],86:[2,46],88:[2,46]},{52:54,54:[2,83],65:[2,83],72:[2,83],80:[2,83],81:[2,83],82:[2,83],83:[2,83],84:[2,83],85:[2,83],86:[2,83]},{25:55,38:57,39:[1,59],43:58,44:[1,60],45:56,47:[2,55]},{28:61,43:62,44:[1,60],47:[2,57]},{13:64,15:[1,20],18:[1,63]},{15:[2,49],18:[2,49]},{33:[2,87],57:65,65:[2,87],72:[2,87],80:[2,87],81:[2,87],82:[2,87],83:[2,87],84:[2,87],85:[2,87],86:[2,87]},{33:[2,41],65:[2,41],72:[2,41],80:[2,41],81:[2,41],82:[2,41],83:[2,41],84:[2,41],85:[2,41],86:[2,41]},{33:[2,42],65:[2,42],72:[2,42],80:[2,42],81:[2,42],82:[2,42],83:[2,42],84:[2,42],85:[2,42],86:[2,42]},{20:66,72:[1,36],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,33],86:[1,35],87:34},{26:67,47:[1,68]},{30:69,33:[2,59],65:[2,59],72:[2,59],75:[2,59],80:[2,59],81:[2,59],82:[2,59],83:[2,59],84:[2,59],85:[2,59],86:[2,59]},{33:[2,65],35:70,65:[2,65],72:[2,65],75:[2,65],80:[2,65],81:[2,65],82:[2,65],83:[2,65],84:[2,65],85:[2,65],86:[2,65]},{21:71,23:[2,51],65:[2,51],72:[2,51],80:[2,51],81:[2,51],82:[2,51],83:[2,51],84:[2,51],85:[2,51],86:[2,51]},{33:[2,91],61:72,65:[2,91],72:[2,91],80:[2,91],81:[2,91],82:[2,91],83:[2,91],84:[2,91],85:[2,91],86:[2,91]},{20:76,33:[2,81],50:73,63:74,64:77,65:[1,45],69:75,70:78,71:79,72:[1,80],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,33],86:[1,35],87:34},{72:[1,81]},{23:[2,43],33:[2,43],54:[2,43],65:[2,43],68:[2,43],72:[2,43],75:[2,43],80:[2,43],81:[2,43],82:[2,43],83:[2,43],84:[2,43],85:[2,43],86:[2,43],88:[1,52]},{20:76,53:82,54:[2,85],63:83,64:77,65:[1,45],69:84,70:78,71:79,72:[1,80],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,33],86:[1,35],87:34},{26:85,47:[1,68]},{47:[2,56]},{4:86,6:3,14:[2,47],15:[2,47],19:[2,47],29:[2,47],34:[2,47],39:[2,47],44:[2,47],47:[2,47],48:[2,47],51:[2,47],55:[2,47],60:[2,47]},{47:[2,20]},{20:87,72:[1,36],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,33],86:[1,35],87:34},{4:88,6:3,14:[2,47],15:[2,47],19:[2,47],29:[2,47],34:[2,47],47:[2,47],48:[2,47],51:[2,47],55:[2,47],60:[2,47]},{26:89,47:[1,68]},{47:[2,58]},{5:[2,11],14:[2,11],15:[2,11],19:[2,11],29:[2,11],34:[2,11],39:[2,11],44:[2,11],47:[2,11],48:[2,11],51:[2,11],55:[2,11],60:[2,11]},{15:[2,50],18:[2,50]},{20:76,33:[2,89],58:90,63:91,64:77,65:[1,45],69:92,70:78,71:79,72:[1,80],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,33],86:[1,35],87:34},{65:[2,95],66:93,68:[2,95],72:[2,95],80:[2,95],81:[2,95],82:[2,95],83:[2,95],84:[2,95],85:[2,95],86:[2,95]},{5:[2,25],14:[2,25],15:[2,25],19:[2,25],29:[2,25],34:[2,25],39:[2,25],44:[2,25],47:[2,25],48:[2,25],51:[2,25],55:[2,25],60:[2,25]},{20:94,72:[1,36],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,33],86:[1,35],87:34},{20:76,31:95,33:[2,61],63:96,64:77,65:[1,45],69:97,70:78,71:79,72:[1,80],75:[2,61],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,33],86:[1,35],87:34},{20:76,33:[2,67],36:98,63:99,64:77,65:[1,45],69:100,70:78,71:79,72:[1,80],75:[2,67],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,33],86:[1,35],87:34},{20:76,22:101,23:[2,53],63:102,64:77,65:[1,45],69:103,70:78,71:79,72:[1,80],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,33],86:[1,35],87:34},{20:76,33:[2,93],62:104,63:105,64:77,65:[1,45],69:106,70:78,71:79,72:[1,80],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,33],86:[1,35],87:34},{33:[1,107]},{33:[2,80],65:[2,80],72:[2,80],80:[2,80],81:[2,80],82:[2,80],83:[2,80],84:[2,80],85:[2,80],86:[2,80]},{33:[2,82]},{23:[2,27],33:[2,27],54:[2,27],65:[2,27],68:[2,27],72:[2,27],75:[2,27],80:[2,27],81:[2,27],82:[2,27],83:[2,27],84:[2,27],85:[2,27],86:[2,27]},{23:[2,28],33:[2,28],54:[2,28],65:[2,28],68:[2,28],72:[2,28],75:[2,28],80:[2,28],81:[2,28],82:[2,28],83:[2,28],84:[2,28],85:[2,28],86:[2,28]},{23:[2,30],33:[2,30],54:[2,30],68:[2,30],71:108,72:[1,109],75:[2,30]},{23:[2,99],33:[2,99],54:[2,99],68:[2,99],72:[2,99],75:[2,99]},{23:[2,46],33:[2,46],54:[2,46],65:[2,46],68:[2,46],72:[2,46],73:[1,110],75:[2,46],80:[2,46],81:[2,46],82:[2,46],83:[2,46],84:[2,46],85:[2,46],86:[2,46],88:[2,46]},{23:[2,45],33:[2,45],54:[2,45],65:[2,45],68:[2,45],72:[2,45],75:[2,45],80:[2,45],81:[2,45],82:[2,45],83:[2,45],84:[2,45],85:[2,45],86:[2,45],88:[2,45]},{54:[1,111]},{54:[2,84],65:[2,84],72:[2,84],80:[2,84],81:[2,84],82:[2,84],83:[2,84],84:[2,84],85:[2,84],86:[2,84]},{54:[2,86]},{5:[2,13],14:[2,13],15:[2,13],19:[2,13],29:[2,13],34:[2,13],39:[2,13],44:[2,13],47:[2,13],48:[2,13],51:[2,13],55:[2,13],60:[2,13]},{38:57,39:[1,59],43:58,44:[1,60],45:113,46:112,47:[2,77]},{33:[2,71],40:114,65:[2,71],72:[2,71],75:[2,71],80:[2,71],81:[2,71],82:[2,71],83:[2,71],84:[2,71],85:[2,71],86:[2,71]},{47:[2,18]},{5:[2,14],14:[2,14],15:[2,14],19:[2,14],29:[2,14],34:[2,14],39:[2,14],44:[2,14],47:[2,14],48:[2,14],51:[2,14],55:[2,14],60:[2,14]},{33:[1,115]},{33:[2,88],65:[2,88],72:[2,88],80:[2,88],81:[2,88],82:[2,88],83:[2,88],84:[2,88],85:[2,88],86:[2,88]},{33:[2,90]},{20:76,63:117,64:77,65:[1,45],67:116,68:[2,97],69:118,70:78,71:79,72:[1,80],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,33],86:[1,35],87:34},{33:[1,119]},{32:120,33:[2,63],74:121,75:[1,122]},{33:[2,60],65:[2,60],72:[2,60],75:[2,60],80:[2,60],81:[2,60],82:[2,60],83:[2,60],84:[2,60],85:[2,60],86:[2,60]},{33:[2,62],75:[2,62]},{33:[2,69],37:123,74:124,75:[1,122]},{33:[2,66],65:[2,66],72:[2,66],75:[2,66],80:[2,66],81:[2,66],82:[2,66],83:[2,66],84:[2,66],85:[2,66],86:[2,66]},{33:[2,68],75:[2,68]},{23:[1,125]},{23:[2,52],65:[2,52],72:[2,52],80:[2,52],81:[2,52],82:[2,52],83:[2,52],84:[2,52],85:[2,52],86:[2,52]},{23:[2,54]},{33:[1,126]},{33:[2,92],65:[2,92],72:[2,92],80:[2,92],81:[2,92],82:[2,92],83:[2,92],84:[2,92],85:[2,92],86:[2,92]},{33:[2,94]},{5:[2,22],14:[2,22],15:[2,22],19:[2,22],29:[2,22],34:[2,22],39:[2,22],44:[2,22],47:[2,22],48:[2,22],51:[2,22],55:[2,22],60:[2,22]},{23:[2,100],33:[2,100],54:[2,100],68:[2,100],72:[2,100],75:[2,100]},{73:[1,110]},{20:76,63:127,64:77,65:[1,45],72:[1,36],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,33],86:[1,35],87:34},{5:[2,23],14:[2,23],15:[2,23],19:[2,23],29:[2,23],34:[2,23],39:[2,23],44:[2,23],47:[2,23],48:[2,23],51:[2,23],55:[2,23],60:[2,23]},{47:[2,19]},{47:[2,78]},{20:76,33:[2,73],41:128,63:129,64:77,65:[1,45],69:130,70:78,71:79,72:[1,80],75:[2,73],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,33],86:[1,35],87:34},{5:[2,24],14:[2,24],15:[2,24],19:[2,24],29:[2,24],34:[2,24],39:[2,24],44:[2,24],47:[2,24],48:[2,24],51:[2,24],55:[2,24],60:[2,24]},{68:[1,131]},{65:[2,96],68:[2,96],72:[2,96],80:[2,96],81:[2,96],82:[2,96],83:[2,96],84:[2,96],85:[2,96],86:[2,96]},{68:[2,98]},{5:[2,21],14:[2,21],15:[2,21],19:[2,21],29:[2,21],34:[2,21],39:[2,21],44:[2,21],47:[2,21],48:[2,21],51:[2,21],55:[2,21],60:[2,21]},{33:[1,132]},{33:[2,64]},{72:[1,134],76:133},{33:[1,135]},{33:[2,70]},{15:[2,12]},{14:[2,26],15:[2,26],19:[2,26],29:[2,26],34:[2,26],47:[2,26],48:[2,26],51:[2,26],55:[2,26],60:[2,26]},{23:[2,31],33:[2,31],54:[2,31],68:[2,31],72:[2,31],75:[2,31]},{33:[2,75],42:136,74:137,75:[1,122]},{33:[2,72],65:[2,72],72:[2,72],75:[2,72],80:[2,72],81:[2,72],82:[2,72],83:[2,72],84:[2,72],85:[2,72],86:[2,72]},{33:[2,74],75:[2,74]},{23:[2,29],33:[2,29],54:[2,29],65:[2,29],68:[2,29],72:[2,29],75:[2,29],80:[2,29],81:[2,29],82:[2,29],83:[2,29],84:[2,29],85:[2,29],86:[2,29]},{14:[2,15],15:[2,15],19:[2,15],29:[2,15],34:[2,15],39:[2,15],44:[2,15],47:[2,15],48:[2,15],51:[2,15],55:[2,15],60:[2,15]},{72:[1,139],77:[1,138]},{72:[2,101],77:[2,101]},{14:[2,16],15:[2,16],19:[2,16],29:[2,16],34:[2,16],44:[2,16],47:[2,16],48:[2,16],51:[2,16],55:[2,16],60:[2,16]},{33:[1,140]},{33:[2,76]},{33:[2,32]},{72:[2,102],77:[2,102]},{14:[2,17],15:[2,17],19:[2,17],29:[2,17],34:[2,17],39:[2,17],44:[2,17],47:[2,17],48:[2,17],51:[2,17],55:[2,17],60:[2,17]}],
defaultActions: {4:[2,1],56:[2,56],58:[2,20],62:[2,58],75:[2,82],84:[2,86],88:[2,18],92:[2,90],103:[2,54],106:[2,94],112:[2,19],113:[2,78],118:[2,98],121:[2,64],124:[2,70],125:[2,12],137:[2,76],138:[2,32]},
parseError: function parseError(str, hash) {
    throw new Error(str);
},
parse: function parse(input) {
    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = "", yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    this.yy.parser = this;
    if (typeof this.lexer.yylloc == "undefined")
        this.lexer.yylloc = {};
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);
    var ranges = this.lexer.options && this.lexer.options.ranges;
    if (typeof this.yy.parseError === "function")
        this.parseError = this.yy.parseError;
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    function lex() {
        var token;
        token = self.lexer.lex() || 1;
        if (typeof token !== "number") {
            token = self.symbols_[token] || token;
        }
        return token;
    }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == "undefined") {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
        if (typeof action === "undefined" || !action.length || !action[0]) {
            var errStr = "";
            if (!recovering) {
                expected = [];
                for (p in table[state])
                    if (this.terminals_[p] && p > 2) {
                        expected.push("'" + this.terminals_[p] + "'");
                    }
                if (this.lexer.showPosition) {
                    errStr = "Parse error on line " + (yylineno + 1) + ":\n" + this.lexer.showPosition() + "\nExpecting " + expected.join(", ") + ", got '" + (this.terminals_[symbol] || symbol) + "'";
                } else {
                    errStr = "Parse error on line " + (yylineno + 1) + ": Unexpected " + (symbol == 1?"end of input":"'" + (this.terminals_[symbol] || symbol) + "'");
                }
                this.parseError(errStr, {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
            }
        }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error("Parse Error: multiple actions possible at state: " + state + ", token: " + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(this.lexer.yytext);
            lstack.push(this.lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                if (recovering > 0)
                    recovering--;
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {first_line: lstack[lstack.length - (len || 1)].first_line, last_line: lstack[lstack.length - 1].last_line, first_column: lstack[lstack.length - (len || 1)].first_column, last_column: lstack[lstack.length - 1].last_column};
            if (ranges) {
                yyval._$.range = [lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1]];
            }
            r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
            if (typeof r !== "undefined") {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}
};
/* Jison generated lexer */
var lexer = (function(){
var lexer = ({EOF:1,
parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },
setInput:function (input) {
        this._input = input;
        this._more = this._less = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {first_line:1,first_column:0,last_line:1,last_column:0};
        if (this.options.ranges) this.yylloc.range = [0,0];
        this.offset = 0;
        return this;
    },
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) this.yylloc.range[1]++;

        this._input = this._input.slice(1);
        return ch;
    },
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length-len-1);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length-1);
        this.matched = this.matched.substr(0, this.matched.length-1);

        if (lines.length-1) this.yylineno -= lines.length-1;
        var r = this.yylloc.range;

        this.yylloc = {first_line: this.yylloc.first_line,
          last_line: this.yylineno+1,
          first_column: this.yylloc.first_column,
          last_column: lines ?
              (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length:
              this.yylloc.first_column - len
          };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        return this;
    },
more:function () {
        this._more = true;
        return this;
    },
less:function (n) {
        this.unput(this.match.slice(n));
    },
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20)+(next.length > 20 ? '...':'')).replace(/\n/g, "");
    },
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c+"^";
    },
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) this.done = true;

        var token,
            match,
            tempMatch,
            index,
            col,
            lines;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i=0;i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (!this.options.flex) break;
            }
        }
        if (match) {
            lines = match[0].match(/(?:\r\n?|\n).*/g);
            if (lines) this.yylineno += lines.length;
            this.yylloc = {first_line: this.yylloc.last_line,
                           last_line: this.yylineno+1,
                           first_column: this.yylloc.last_column,
                           last_column: lines ? lines[lines.length-1].length-lines[lines.length-1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length};
            this.yytext += match[0];
            this.match += match[0];
            this.matches = match;
            this.yyleng = this.yytext.length;
            if (this.options.ranges) {
                this.yylloc.range = [this.offset, this.offset += this.yyleng];
            }
            this._more = false;
            this._input = this._input.slice(match[0].length);
            this.matched += match[0];
            token = this.performAction.call(this, this.yy, this, rules[index],this.conditionStack[this.conditionStack.length-1]);
            if (this.done && this._input) this.done = false;
            if (token) return token;
            else return;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line '+(this.yylineno+1)+'. Unrecognized text.\n'+this.showPosition(),
                    {text: "", token: null, line: this.yylineno});
        }
    },
lex:function lex() {
        var r = this.next();
        if (typeof r !== 'undefined') {
            return r;
        } else {
            return this.lex();
        }
    },
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },
popState:function popState() {
        return this.conditionStack.pop();
    },
_currentRules:function _currentRules() {
        return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules;
    },
topState:function () {
        return this.conditionStack[this.conditionStack.length-2];
    },
pushState:function begin(condition) {
        this.begin(condition);
    }});
lexer.options = {};
lexer.performAction = function anonymous(yy,yy_,$avoiding_name_collisions,YY_START
/**/) {


function strip(start, end) {
  return yy_.yytext = yy_.yytext.substr(start, yy_.yyleng-end);
}


var YYSTATE=YY_START
switch($avoiding_name_collisions) {
case 0:
                                   if(yy_.yytext.slice(-2) === "\\\\") {
                                     strip(0,1);
                                     this.begin("mu");
                                   } else if(yy_.yytext.slice(-1) === "\\") {
                                     strip(0,1);
                                     this.begin("emu");
                                   } else {
                                     this.begin("mu");
                                   }
                                   if(yy_.yytext) return 15;
                                 
break;
case 1:return 15;
break;
case 2:
                                   this.popState();
                                   return 15;
                                 
break;
case 3:this.begin('raw'); return 15;
break;
case 4:
                                  this.popState();
                                  // Should be using `this.topState()` below, but it currently
                                  // returns the second top instead of the first top. Opened an
                                  // issue about it at https://github.com/zaach/jison/issues/291
                                  if (this.conditionStack[this.conditionStack.length-1] === 'raw') {
                                    return 15;
                                  } else {
                                    yy_.yytext = yy_.yytext.substr(5, yy_.yyleng-9);
                                    return 'END_RAW_BLOCK';
                                  }
                                 
break;
case 5: return 15; 
break;
case 6:
  this.popState();
  return 14;

break;
case 7:return 65;
break;
case 8:return 68;
break;
case 9: return 19; 
break;
case 10:
                                  this.popState();
                                  this.begin('raw');
                                  return 23;
                                 
break;
case 11:return 55;
break;
case 12:return 60;
break;
case 13:return 29;
break;
case 14:return 47;
break;
case 15:this.popState(); return 44;
break;
case 16:this.popState(); return 44;
break;
case 17:return 34;
break;
case 18:return 39;
break;
case 19:return 51;
break;
case 20:return 48;
break;
case 21:
  this.unput(yy_.yytext);
  this.popState();
  this.begin('com');

break;
case 22:
  this.popState();
  return 14;

break;
case 23:return 48;
break;
case 24:return 73;
break;
case 25:return 72;
break;
case 26:return 72;
break;
case 27:return 88;
break;
case 28:// ignore whitespace
break;
case 29:this.popState(); return 54;
break;
case 30:this.popState(); return 33;
break;
case 31:yy_.yytext = strip(1,2).replace(/\\"/g,'"'); return 80;
break;
case 32:yy_.yytext = strip(1,2).replace(/\\'/g,"'"); return 80;
break;
case 33:yy_.yytext = strip(1,2).replace(/\\`/g,"`"); return 81;
break;
case 34:return 86;
break;
case 35:return 83;
break;
case 36:return 83;
break;
case 37:return 84;
break;
case 38:return 85;
break;
case 39:return 82;
break;
case 40:return 75;
break;
case 41:return 77;
break;
case 42:return 72;
break;
case 43:yy_.yytext = yy_.yytext.replace(/\\([\\\]])/g,'$1'); return 72;
break;
case 44:return 'INVALID';
break;
case 45:return 5;
break;
}
};
lexer.rules = [/^(?:[^\x00]*?(?=(\{\{)))/,/^(?:[^\x00]+)/,/^(?:[^\x00]{2,}?(?=(\{\{|\\\{\{|\\\\\{\{|$)))/,/^(?:\{\{\{\{(?=[^/]))/,/^(?:\{\{\{\{\/[^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=[=}\s\/.])\}\}\}\})/,/^(?:[^\x00]*?(?=(\{\{\{\{)))/,/^(?:[\s\S]*?--(~)?\}\})/,/^(?:\()/,/^(?:\))/,/^(?:\{\{\{\{)/,/^(?:\}\}\}\})/,/^(?:\{\{(~)?>)/,/^(?:\{\{(~)?#>)/,/^(?:\{\{(~)?#\*?)/,/^(?:\{\{(~)?\/)/,/^(?:\{\{(~)?\^\s*(~)?\}\})/,/^(?:\{\{(~)?\s*else\s*(~)?\}\})/,/^(?:\{\{(~)?\^)/,/^(?:\{\{(~)?\s*else\b)/,/^(?:\{\{(~)?\{)/,/^(?:\{\{(~)?&)/,/^(?:\{\{(~)?!--)/,/^(?:\{\{(~)?![\s\S]*?\}\})/,/^(?:\{\{(~)?\*?)/,/^(?:=)/,/^(?:\.\.)/,/^(?:\.(?=([=~}\s\/.)|])))/,/^(?:[\/.])/,/^(?:\s+)/,/^(?:\}(~)?\}\})/,/^(?:(~)?\}\})/,/^(?:"(\\["]|[^"])*")/,/^(?:'(\\[']|[^'])*')/,/^(?:`(\\[`]|[^`])*`)/,/^(?:@)/,/^(?:true(?=([~}\s)])))/,/^(?:false(?=([~}\s)])))/,/^(?:undefined(?=([~}\s)])))/,/^(?:null(?=([~}\s)])))/,/^(?:-?[0-9]+(?:\.[0-9]+)?(?=([~}\s)])))/,/^(?:as\s+\|)/,/^(?:\|)/,/^(?:([^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=([=~}\s\/.)|]))))/,/^(?:\[(\\\]|[^\]])*\])/,/^(?:.)/,/^(?:$)/];
lexer.conditions = {"mu":{"rules":[7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45],"inclusive":false},"emu":{"rules":[2],"inclusive":false},"com":{"rules":[6],"inclusive":false},"raw":{"rules":[3,4,5],"inclusive":false},"INITIAL":{"rules":[0,1,45],"inclusive":true}};
return lexer;})()
parser.lexer = lexer;
function Parser () { this.yy = {}; }Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();exports.__esModule = true;
exports['default'] = handlebars;
