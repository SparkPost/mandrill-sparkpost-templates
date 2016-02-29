var handlebars = require('handlebars')
  , Visitor = handlebars.Visitor;

function SyntaxCheckingPass() {
  this.infractions = [];
  this.supportedHelpers = ['if', 'each', 'unless'];
  this.unsupportedSyntax('PartialStatement');
  this.unsupportedSyntax('PartialBlockStatement');
  this.supportedHelpersOnly('MustacheStatement');
  this.supportedHelpersOnly('BlockStatement');
}

SyntaxCheckingPass.prototype = new Visitor();

SyntaxCheckingPass.prototype.unsupportedSyntax = function(blockType) {
  var self = this;
  self[blockType] = function(stmt) {
    self.infractions.unshift(stmt);
    Visitor.prototype[blockType].call(self, stmt);
  };
};

SyntaxCheckingPass.prototype.supportedHelpersOnly = function(stmtType) {
  var self = this;
  self[stmtType] = function(stmt) {
    if (self.supportedHelpers.indexOf(stmt.path.parts[0]) < 0) {
      self.infractions.unshift(stmt);
    }
    Visitor.prototype[stmtType].call(self, stmt);
  };
};

module.exports = SyntaxCheckingPass;
