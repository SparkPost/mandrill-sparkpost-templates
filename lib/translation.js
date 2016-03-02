'use strict';

var handlebars = require('handlebars')
  , Visitor = handlebars.Visitor;

/*
 * This Handlebars AST visitor generates SparkPost template syntax.
 */

function TranslationPass(emitFn) {
  this.emit = emitFn;
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

TranslationPass.prototype.MustacheStatement = function(stmt) {
  var part = stmt.path.parts[0];
  this.emit('{{');
  if (stmt.path.parts.length > 0) {
    this.emit(this.resolvePath(stmt.path));
  } else if (this.eachBlocks.length > 0) {
    this.emit('loop_var');
  } else {
    // A this reference used outside each block context
    var err = new Error('this must only be used inside each');
    err.name = 'TranslationError';
    err.astNode = stmt;
    throw err;
  }
  this.emit('}}');
};

TranslationPass.prototype.BlockStatement = function(stmt) {
  var blockName = stmt.path.parts[0];
  if (this.blockHandlers.hasOwnProperty(blockName)) {
    this.blockHandlers[blockName](stmt);
  } else {
    var err = Error('Unsupported block: ' + blockName);
    err.name = 'TranslationError';
    err.astNode = stmt;
    throw err;
  }
};

TranslationPass.prototype.ifStatement = function(stmt) {
  this.emit('{{if ');
  this.accept(stmt.params[0]);
  this.emit('}}');
  this.acceptKey(stmt, 'program');
  if (stmt.inverse) {
    this.emit('{{else}}');
    this.acceptKey(stmt, 'inverse');
  }
  this.emit('{{end}}');
};

TranslationPass.prototype.eachStatement = function(stmt) {
  var param = this.resolvePath(stmt.params[0]);
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
  return path.join('.');
};

TranslationPass.prototype.ContentStatement = function(stmt) {
  this.emit(stmt.value);
};

TranslationPass.prototype.PathExpression = function(stmt) {
  // TODO: flatten relative/nested expressions
  this.emit(stmt.parts.join('.'));
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
function sourcePrep(src) {
  // TODO: handle escaped handlebars \\{{}}
  return src.replace(/\{\{elseif(.+?)\}\}/g, '{{else if$1}}');
}

// ----------------------------------------------------------------------------

module.exports = {
  TranslationPass: TranslationPass,
  sourcePrep: sourcePrep
};

