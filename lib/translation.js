'use strict';

var handlebars = require('handlebars')
  , Visitor = handlebars.Visitor
  , dbgSpew = true
  , juice = require('juice')
  ;

/*
 * This Handlebars AST visitor generates SparkPost template syntax.
 */

function TranslationPass(emitFn) {
  if (dbgSpew) {
    this.emit = function(s) {
      emitFn(s);
    };
  } else {
    this.emit = emitFn;
  }

  this.blockHandlers = {};
  this.eachBlocks = [];
  this.literal('StringLiteral');
  this.literal('NumberLiteral');
  this.literal('BooleanLiteral');
  this.literal('ExprLiteral');
  this.block('if', this.ifStatement.bind(this));
  this.block('each', this.eachStatement.bind(this));
}

TranslationPass.prototype = new Visitor();

TranslationPass.prototype.literal = function(node) {
  var self = this;
  self[node] = function(stmt) {
    self.emit(stmt.value);
  }
};

TranslationPass.prototype.block = function(blockName, handler) {
  this.blockHandlers[blockName] = handler;
};

// There are 2 cases here.  The other possibilities are filtered out
// by SyntaxCheckingPass which must be used before this pass.
// 1) {{path}} : path is in parts, params is empty
// 2) {{helper path}} : helper is in parts, path is in params[0]
TranslationPass.prototype.MustacheStatement = function(stmt) {
  var part = stmt.path.parts[0];
  this.emit('{{');
  if (stmt.params.length == 0) {
    this.variable(stmt.path, stmt);
  } else if (stmt.path.parts.length == 1) {
    // We only support a few helpers (and we actually ignore them)
    this.variable(stmt.params[0], stmt);
  }
  this.emit('}}');
};

TranslationPass.prototype.variable = function(path, stmt) {
  if (path.parts.length > 0) {
    this.emit(this.resolvePath(path));
  } else if (this.eachBlocks.length > 0) {
    this.emit('loop_var');
  } else {
    // A this reference used outside each block context
    var err = new Error('this must only be used inside each');
    err.name = 'TranslationError';
    err.astNode = stmt;
    throw err;
  }
};

TranslationPass.prototype.BlockStatement = function(stmt) {
  var blockName = stmt.path.parts[0]
    , param;
  if (this.blockHandlers.hasOwnProperty(blockName)) {
    // Traditional block: {{#if x}}, {{#each array}, ...
    if (stmt.params[0].type == 'ExprLiteral') {
      param = stmt.params[0].value;
    } else {
      param = this.resolvePath(stmt.params[0]);
    }
    this.blockHandlers[blockName](stmt, param);
  } else if (stmt.params.length == 0) {
    // Anonymous array iteration block: {{#myarray}}
    param = this.resolvePath(stmt.path);
    this.eachStatement(stmt, param);
  } else {
    var err = Error('Unsupported block: ' + blockName);
    err.name = 'TranslationError';
    err.astNode = stmt;
    throw err;
  }
};

TranslationPass.prototype.ifStatement = function(stmt, param) {
  this.emit('{{if ');
  this.emit(param);
  this.emit('}}');
  this.acceptKey(stmt, 'program');
  if (stmt.inverse) {
    this.emit('{{else}}');
    this.acceptKey(stmt, 'inverse');
  }
  this.emit('{{end}}');
};

TranslationPass.prototype.eachStatement = function(stmt, param) {
  this.eachBlocks.unshift(stmt);
  this.emit('{{each ');
  this.emit(param);
  this.emit('}}');
  this.acceptKey(stmt, 'program');
  this.emit('{{end}}');
  if (this.eachBlocks[0] !== stmt) {
    var err = Error('Unbalanced each block closure');
    err.name = 'TranslationError';
    err.astNode = stmt;
    throw err;
  }
  this.eachBlocks.shift();
};

TranslationPass.prototype.resolvePath = function(path) {
  var depth = path.depth
    , nodeidx = 1
    , prefix
    , resolved;

  if (depth > 0 && depth > this.eachBlocks.length) {
    var err = Error('Relative path deeper than block nesting');
    err.name = 'TranslationError';
    err.astNode = stmt;
    throw err;
  }

  // Prepend variable context:
  //   depth > 0: Flatten nested path using nth parent 'each' block as context
  //   depth == 0: Use current parent each block as context
  if (this.eachBlocks.length > 0) {
    prefix = 'loop_vars.' + this.translateVarRef(this.eachBlocks[depth].params[0].parts) + '.';
  } else {
    prefix = '';
  }

  return prefix + this.translateVarRef(path.parts);
};

TranslationPass.prototype.translateVarRef = function(path) {
  return path.map(function(elt, idx) {
    if (idx > 0) {
      if (/^[0-9]+$/.test(elt)) {
        var eltnum = (+elt) + 1;
        return '[' + eltnum + ']';
      }
      return '.' + elt;
    }
    return elt;
  }).join('');
};

TranslationPass.prototype.ContentStatement = function(stmt) {
  this.emit(stmt.original);
};

TranslationPass.prototype.PathExpression = function(stmt) {
  this.emit(this.translateVarRef(stmt.parts));
};

TranslationPass.prototype.UndefinedLiteral = function(stmt) {
};

TranslationPass.prototype.NullLiteral = function(stmt) {
};

TranslationPass.prototype.Hash = function(stmt) {
};

TranslationPass.prototype.HashPair = function(stmt) {
};

// ----------------------------------------------------------------------------
// {{elseif ...}} -> {{else if ...}}
// *|mergeTag|* -> {{mergeTag}}
function sourcePrep(src) {
  // TODO: handle escaped handlebars \\{{}}
  return src.replace(/\{\{elseif(.+?)\}\}/g, '{{else if$1}}')
    .replace(/\*\|([a-zA-Z0-9_]*)\|\*/g, '{{$1}}');
}

// inline the style
//
function inlineStyle(src) {

  var options
  ;

  options = {
   removeStyleTags: false
  };

  src = juice(src, options);

  return src;
}

// ----------------------------------------------------------------------------

module.exports = {
  TranslationPass: TranslationPass,
  sourcePrep: sourcePrep,
  inlineStyle: inlineStyle
};

