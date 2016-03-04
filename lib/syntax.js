var handlebars = require('handlebars')
  , Visitor = handlebars.Visitor;

function SyntaxCheckingPass() {
  this.infractions = [];
  this.supportedBlockHelpers = ['if', 'each', 'unless'];
  this.supportedBlockHelpersOnly('BlockStatement');
  this.supportedSingleStmtHelpers = ['upper', 'lower', 'title'];
}

SyntaxCheckingPass.prototype = new Visitor();

SyntaxCheckingPass.prototype.logInfraction = function(msg, astNode) {
  this.infractions.unshift({msg:msg, node:astNode});
};

SyntaxCheckingPass.prototype.ExprLiteral = function() {};

SyntaxCheckingPass.prototype.PartialStatement = function(stmt) {
  this.logInfraction(stmt.name.original + ' statements are not supported', stmt);
  Visitor.prototype.PartialStatement.call(this, stmt);
};

SyntaxCheckingPass.prototype.PartialBlockStatement = function(stmt) {
  this.logInfraction(stmt.name.original + ' statements are not supported', stmt);
  Visitor.prototype.PartialBlockStatement.call(this, stmt);
};

SyntaxCheckingPass.prototype.supportedBlockHelpersOnly = function(stmtType) {
  var self = this;
  self[stmtType] = function(stmt) {
    if (self.supportedBlockHelpers.indexOf(stmt.path.parts[0]) < 0) {
      self.logInfraction(stmt.path.original + ' helpers are not supported', stmt);
    }
    Visitor.prototype[stmtType].call(self, stmt);
  };
};

SyntaxCheckingPass.prototype.MustacheStatement = function(stmt) {
  // Accept statement of the form {{helper arg}} only and only a
  // specific set of helper names
  // - helper is in stmt.path
  // - arg is in params[0] 
  if (stmt.params.length == 0) {
    Visitor.prototype.MustacheStatement.call(this, stmt);
  } else if (stmt.params.length == 1 && stmt.path.parts.length == 1 &&
    this.supportedSingleStmtHelpers.indexOf(stmt.path.parts[0]) >= 0) {
    Visitor.prototype.MustacheStatement.call(this, stmt);
  } else {
    this.logInfraction('"' + stmt.path.original + '" mustache statements are not supported', stmt);
  }
};

module.exports = SyntaxCheckingPass;

