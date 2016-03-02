var handlebars = require('handlebars')
  , Visitor = handlebars.Visitor;

function SyntaxCheckingPass() {
  this.infractions = [];
  this.supportedHelpers = ['if', 'each', 'unless'];
  this.supportedHelpersOnly('BlockStatement');
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

SyntaxCheckingPass.prototype.supportedHelpersOnly = function(stmtType) {
  var self = this;
  self[stmtType] = function(stmt) {
    if (self.supportedHelpers.indexOf(stmt.path.parts[0]) < 0) {
      self.logInfraction(stmt.path.original + ' helpers are not supported', stmt);
    }
    Visitor.prototype[stmtType].call(self, stmt);
  };
};

SyntaxCheckingPass.prototype.MustacheStatement = function(stmt) {
  if (stmt.params.length > 0) {
    this.logInfraction('"' + stmt.path.original + '" mustache statements are not supported', stmt);
  }
  Visitor.prototype.MustacheStatement.call(this, stmt);
};

module.exports = SyntaxCheckingPass;

