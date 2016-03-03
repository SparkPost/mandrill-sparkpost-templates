'use strict';

exports.__esModule = true;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _base = require('../base');

var _exception = require('../exception');

var _exception2 = _interopRequireDefault(_exception);

var _utils = require('../utils');

var _codeGen = require('./code-gen');

var _codeGen2 = _interopRequireDefault(_codeGen);

function Literal(value) {
  this.value = value;
}

function JavaScriptCompiler() {}

JavaScriptCompiler.prototype = {
  // PUBLIC API: You can override these methods in a subclass to provide
  // alternative compiled forms for name lookup and buffering semantics
  nameLookup: function nameLookup(parent, name /* , type*/) {
    if (JavaScriptCompiler.isValidJavaScriptVariableName(name)) {
      return [parent, '.', name];
    } else {
      return [parent, '[', JSON.stringify(name), ']'];
    }
  },
  depthedLookup: function depthedLookup(name) {
    return [this.aliasable('container.lookup'), '(depths, "', name, '")'];
  },

  compilerInfo: function compilerInfo() {
    var revision = _base.COMPILER_REVISION,
        versions = _base.REVISION_CHANGES[revision];
    return [revision, versions];
  },

  appendToBuffer: function appendToBuffer(source, location, explicit) {
    // Force a source as this simplifies the merge logic.
    if (!_utils.isArray(source)) {
      source = [source];
    }
    source = this.source.wrap(source, location);

    if (this.environment.isSimple) {
      return ['return ', source, ';'];
    } else if (explicit) {
      // This is a case where the buffer operation occurs as a child of another
      // construct, generally braces. We have to explicitly output these buffer
      // operations to ensure that the emitted code goes in the correct location.
      return ['buffer += ', source, ';'];
    } else {
      source.appendToBuffer = true;
      return source;
    }
  },

  initializeBuffer: function initializeBuffer() {
    return this.quotedString('');
  },
  // END PUBLIC API

  compile: function compile(environment, options, context, asObject) {
    this.environment = environment;
    this.options = options;
    this.precompile = !asObject;

    this.name = this.environment.name;
    this.isChild = !!context;
    this.context = context || {
      decorators: [],
      programs: [],
      environments: []
    };

    this.preamble();

    this.stackSlot = 0;
    this.stackVars = [];
    this.aliases = {};
    this.registers = { list: [] };
    this.hashes = [];
    this.compileStack = [];
    this.inlineStack = [];
    this.blockParams = [];

    this.compileChildren(environment, options);

    this.useDepths = this.useDepths || environment.useDepths || environment.useDecorators || this.options.compat;
    this.useBlockParams = this.useBlockParams || environment.useBlockParams;

    var opcodes = environment.opcodes,
        opcode = undefined,
        firstLoc = undefined,
        i = undefined,
        l = undefined;

    for (i = 0, l = opcodes.length; i < l; i++) {
      opcode = opcodes[i];

      this.source.currentLocation = opcode.loc;
      firstLoc = firstLoc || opcode.loc;
      this[opcode.opcode].apply(this, opcode.args);
    }

    // Flush any trailing content that might be pending.
    this.source.currentLocation = firstLoc;
    this.pushSource('');

    /* istanbul ignore next */
    if (this.stackSlot || this.inlineStack.length || this.compileStack.length) {
      throw new _exception2['default']('Compile completed with content left on stack');
    }

    if (!this.decorators.isEmpty()) {
      this.useDecorators = true;

      this.decorators.prepend('var decorators = container.decorators;\n');
      this.decorators.push('return fn;');

      if (asObject) {
        this.decorators = Function.apply(this, ['fn', 'props', 'container', 'depth0', 'data', 'blockParams', 'depths', this.decorators.merge()]);
      } else {
        this.decorators.prepend('function(fn, props, container, depth0, data, blockParams, depths) {\n');
        this.decorators.push('}\n');
        this.decorators = this.decorators.merge();
      }
    } else {
      this.decorators = undefined;
    }

    var fn = this.createFunctionContext(asObject);
    if (!this.isChild) {
      var ret = {
        compiler: this.compilerInfo(),
        main: fn
      };

      if (this.decorators) {
        ret.main_d = this.decorators; // eslint-disable-line camelcase
        ret.useDecorators = true;
      }

      var _context = this.context;
      var programs = _context.programs;
      var decorators = _context.decorators;

      for (i = 0, l = programs.length; i < l; i++) {
        if (programs[i]) {
          ret[i] = programs[i];
          if (decorators[i]) {
            ret[i + '_d'] = decorators[i];
            ret.useDecorators = true;
          }
        }
      }

      if (this.environment.usePartial) {
        ret.usePartial = true;
      }
      if (this.options.data) {
        ret.useData = true;
      }
      if (this.useDepths) {
        ret.useDepths = true;
      }
      if (this.useBlockParams) {
        ret.useBlockParams = true;
      }
      if (this.options.compat) {
        ret.compat = true;
      }

      if (!asObject) {
        ret.compiler = JSON.stringify(ret.compiler);

        this.source.currentLocation = { start: { line: 1, column: 0 } };
        ret = this.objectLiteral(ret);

        if (options.srcName) {
          ret = ret.toStringWithSourceMap({ file: options.destName });
          ret.map = ret.map && ret.map.toString();
        } else {
          ret = ret.toString();
        }
      } else {
        ret.compilerOptions = this.options;
      }

      return ret;
    } else {
      return fn;
    }
  },

  preamble: function preamble() {
    // track the last context pushed into place to allow skipping the
    // getContext opcode when it would be a noop
    this.lastContext = 0;
    this.source = new _codeGen2['default'](this.options.srcName);
    this.decorators = new _codeGen2['default'](this.options.srcName);
  },

  createFunctionContext: function createFunctionContext(asObject) {
    var varDeclarations = '';

    var locals = this.stackVars.concat(this.registers.list);
    if (locals.length > 0) {
      varDeclarations += ', ' + locals.join(', ');
    }

    // Generate minimizer alias mappings
    //
    // When using true SourceNodes, this will update all references to the given alias
    // as the source nodes are reused in situ. For the non-source node compilation mode,
    // aliases will not be used, but this case is already being run on the client and
    // we aren't concern about minimizing the template size.
    var aliasCount = 0;
    for (var alias in this.aliases) {
      // eslint-disable-line guard-for-in
      var node = this.aliases[alias];

      if (this.aliases.hasOwnProperty(alias) && node.children && node.referenceCount > 1) {
        varDeclarations += ', alias' + ++aliasCount + '=' + alias;
        node.children[0] = 'alias' + aliasCount;
      }
    }

    var params = ['container', 'depth0', 'helpers', 'partials', 'data'];

    if (this.useBlockParams || this.useDepths) {
      params.push('blockParams');
    }
    if (this.useDepths) {
      params.push('depths');
    }

    // Perform a second pass over the output to merge content when possible
    var source = this.mergeSource(varDeclarations);

    if (asObject) {
      params.push(source);

      return Function.apply(this, params);
    } else {
      return this.source.wrap(['function(', params.join(','), ') {\n  ', source, '}']);
    }
  },
  mergeSource: function mergeSource(varDeclarations) {
    var isSimple = this.environment.isSimple,
        appendOnly = !this.forceBuffer,
        appendFirst = undefined,
        sourceSeen = undefined,
        bufferStart = undefined,
        bufferEnd = undefined;
    this.source.each(function (line) {
      if (line.appendToBuffer) {
        if (bufferStart) {
          line.prepend('  + ');
        } else {
          bufferStart = line;
        }
        bufferEnd = line;
      } else {
        if (bufferStart) {
          if (!sourceSeen) {
            appendFirst = true;
          } else {
            bufferStart.prepend('buffer += ');
          }
          bufferEnd.add(';');
          bufferStart = bufferEnd = undefined;
        }

        sourceSeen = true;
        if (!isSimple) {
          appendOnly = false;
        }
      }
    });

    if (appendOnly) {
      if (bufferStart) {
        bufferStart.prepend('return ');
        bufferEnd.add(';');
      } else if (!sourceSeen) {
        this.source.push('return "";');
      }
    } else {
      varDeclarations += ', buffer = ' + (appendFirst ? '' : this.initializeBuffer());

      if (bufferStart) {
        bufferStart.prepend('return buffer + ');
        bufferEnd.add(';');
      } else {
        this.source.push('return buffer;');
      }
    }

    if (varDeclarations) {
      this.source.prepend('var ' + varDeclarations.substring(2) + (appendFirst ? '' : ';\n'));
    }

    return this.source.merge();
  },

  // [blockValue]
  //
  // On stack, before: hash, inverse, program, value
  // On stack, after: return value of blockHelperMissing
  //
  // The purpose of this opcode is to take a block of the form
  // `{{#this.foo}}...{{/this.foo}}`, resolve the value of `foo`, and
  // replace it on the stack with the result of properly
  // invoking blockHelperMissing.
  blockValue: function blockValue(name) {
    var blockHelperMissing = this.aliasable('helpers.blockHelperMissing'),
        params = [this.contextName(0)];
    this.setupHelperArgs(name, 0, params);

    var blockName = this.popStack();
    params.splice(1, 0, blockName);

    this.push(this.source.functionCall(blockHelperMissing, 'call', params));
  },

  // [ambiguousBlockValue]
  //
  // On stack, before: hash, inverse, program, value
  // Compiler value, before: lastHelper=value of last found helper, if any
  // On stack, after, if no lastHelper: same as [blockValue]
  // On stack, after, if lastHelper: value
  ambiguousBlockValue: function ambiguousBlockValue() {
    // We're being a bit cheeky and reusing the options value from the prior exec
    var blockHelperMissing = this.aliasable('helpers.blockHelperMissing'),
        params = [this.contextName(0)];
    this.setupHelperArgs('', 0, params, true);

    this.flushInline();

    var current = this.topStack();
    params.splice(1, 0, current);

    this.pushSource(['if (!', this.lastHelper, ') { ', current, ' = ', this.source.functionCall(blockHelperMissing, 'call', params), '}']);
  },

  // [appendContent]
  //
  // On stack, before: ...
  // On stack, after: ...
  //
  // Appends the string value of `content` to the current buffer
  appendContent: function appendContent(content) {
    if (this.pendingContent) {
      content = this.pendingContent + content;
    } else {
      this.pendingLocation = this.source.currentLocation;
    }

    this.pendingContent = content;
  },

  // [append]
  //
  // On stack, before: value, ...
  // On stack, after: ...
  //
  // Coerces `value` to a String and appends it to the current buffer.
  //
  // If `value` is truthy, or 0, it is coerced into a string and appended
  // Otherwise, the empty string is appended
  append: function append() {
    if (this.isInline()) {
      this.replaceStack(function (current) {
        return [' != null ? ', current, ' : ""'];
      });

      this.pushSource(this.appendToBuffer(this.popStack()));
    } else {
      var local = this.popStack();
      this.pushSource(['if (', local, ' != null) { ', this.appendToBuffer(local, undefined, true), ' }']);
      if (this.environment.isSimple) {
        this.pushSource(['else { ', this.appendToBuffer("''", undefined, true), ' }']);
      }
    }
  },

  // [appendEscaped]
  //
  // On stack, before: value, ...
  // On stack, after: ...
  //
  // Escape `value` and append it to the buffer
  appendEscaped: function appendEscaped() {
    this.pushSource(this.appendToBuffer([this.aliasable('container.escapeExpression'), '(', this.popStack(), ')']));
  },

  // [getContext]
  //
  // On stack, before: ...
  // On stack, after: ...
  // Compiler value, after: lastContext=depth
  //
  // Set the value of the `lastContext` compiler value to the depth
  getContext: function getContext(depth) {
    this.lastContext = depth;
  },

  // [pushContext]
  //
  // On stack, before: ...
  // On stack, after: currentContext, ...
  //
  // Pushes the value of the current context onto the stack.
  pushContext: function pushContext() {
    this.pushStackLiteral(this.contextName(this.lastContext));
  },

  // [lookupOnContext]
  //
  // On stack, before: ...
  // On stack, after: currentContext[name], ...
  //
  // Looks up the value of `name` on the current context and pushes
  // it onto the stack.
  lookupOnContext: function lookupOnContext(parts, falsy, strict, scoped) {
    var i = 0;

    if (!scoped && this.options.compat && !this.lastContext) {
      // The depthed query is expected to handle the undefined logic for the root level that
      // is implemented below, so we evaluate that directly in compat mode
      this.push(this.depthedLookup(parts[i++]));
    } else {
      this.pushContext();
    }

    this.resolvePath('context', parts, i, falsy, strict);
  },

  // [lookupBlockParam]
  //
  // On stack, before: ...
  // On stack, after: blockParam[name], ...
  //
  // Looks up the value of `parts` on the given block param and pushes
  // it onto the stack.
  lookupBlockParam: function lookupBlockParam(blockParamId, parts) {
    this.useBlockParams = true;

    this.push(['blockParams[', blockParamId[0], '][', blockParamId[1], ']']);
    this.resolvePath('context', parts, 1);
  },

  // [lookupData]
  //
  // On stack, before: ...
  // On stack, after: data, ...
  //
  // Push the data lookup operator
  lookupData: function lookupData(depth, parts, strict) {
    if (!depth) {
      this.pushStackLiteral('data');
    } else {
      this.pushStackLiteral('container.data(data, ' + depth + ')');
    }

    this.resolvePath('data', parts, 0, true, strict);
  },

  resolvePath: function resolvePath(type, parts, i, falsy, strict) {
    // istanbul ignore next

    var _this = this;

    if (this.options.strict || this.options.assumeObjects) {
      this.push(strictLookup(this.options.strict && strict, this, parts, type));
      return;
    }

    var len = parts.length;
    for (; i < len; i++) {
      /* eslint-disable no-loop-func */
      this.replaceStack(function (current) {
        var lookup = _this.nameLookup(current, parts[i], type);
        // We want to ensure that zero and false are handled properly if the context (falsy flag)
        // needs to have the special handling for these values.
        if (!falsy) {
          return [' != null ? ', lookup, ' : ', current];
        } else {
          // Otherwise we can use generic falsy handling
          return [' && ', lookup];
        }
      });
      /* eslint-enable no-loop-func */
    }
  },

  // [resolvePossibleLambda]
  //
  // On stack, before: value, ...
  // On stack, after: resolved value, ...
  //
  // If the `value` is a lambda, replace it on the stack by
  // the return value of the lambda
  resolvePossibleLambda: function resolvePossibleLambda() {
    this.push([this.aliasable('container.lambda'), '(', this.popStack(), ', ', this.contextName(0), ')']);
  },

  emptyHash: function emptyHash(omitEmpty) {
    this.pushStackLiteral(omitEmpty ? 'undefined' : '{}');
  },
  pushHash: function pushHash() {
    if (this.hash) {
      this.hashes.push(this.hash);
    }
    this.hash = { values: [], types: [], contexts: [], ids: [] };
  },
  popHash: function popHash() {
    var hash = this.hash;
    this.hash = this.hashes.pop();

    this.push(this.objectLiteral(hash.values));
  },

  // [pushString]
  //
  // On stack, before: ...
  // On stack, after: quotedString(string), ...
  //
  // Push a quoted version of `string` onto the stack
  pushString: function pushString(string) {
    this.pushStackLiteral(this.quotedString(string));
  },

  // [pushLiteral]
  //
  // On stack, before: ...
  // On stack, after: value, ...
  //
  // Pushes a value onto the stack. This operation prevents
  // the compiler from creating a temporary variable to hold
  // it.
  pushLiteral: function pushLiteral(value) {
    this.pushStackLiteral(value);
  },

  // [pushProgram]
  //
  // On stack, before: ...
  // On stack, after: program(guid), ...
  //
  // Push a program expression onto the stack. This takes
  // a compile-time guid and converts it into a runtime-accessible
  // expression.
  pushProgram: function pushProgram(guid) {
    if (guid != null) {
      this.pushStackLiteral(this.programExpression(guid));
    } else {
      this.pushStackLiteral(null);
    }
  },

  // [registerDecorator]
  //
  // On stack, before: hash, program, params..., ...
  // On stack, after: ...
  //
  // Pops off the decorator's parameters, invokes the decorator,
  // and inserts the decorator into the decorators list.
  registerDecorator: function registerDecorator(paramSize, name) {
    var foundDecorator = this.nameLookup('decorators', name, 'decorator'),
        options = this.setupHelperArgs(name, paramSize);

    this.decorators.push(['fn = ', this.decorators.functionCall(foundDecorator, '', ['fn', 'props', 'container', options]), ' || fn;']);
  },

  // [invokeHelper]
  //
  // On stack, before: hash, inverse, program, params..., ...
  // On stack, after: result of helper invocation
  //
  // Pops off the helper's parameters, invokes the helper,
  // and pushes the helper's return value onto the stack.
  //
  // If the helper is not found, `helperMissing` is called.
  invokeHelper: function invokeHelper(paramSize, name, isSimple) {
    var nonHelper = this.popStack(),
        helper = this.setupHelper(paramSize, name),
        simple = isSimple ? [helper.name, ' || '] : '';

    var lookup = ['('].concat(simple, nonHelper);
    if (!this.options.strict) {
      lookup.push(' || ', this.aliasable('helpers.helperMissing'));
    }
    lookup.push(')');

    this.push(this.source.functionCall(lookup, 'call', helper.callParams));
  },

  // [invokeKnownHelper]
  //
  // On stack, before: hash, inverse, program, params..., ...
  // On stack, after: result of helper invocation
  //
  // This operation is used when the helper is known to exist,
  // so a `helperMissing` fallback is not required.
  invokeKnownHelper: function invokeKnownHelper(paramSize, name) {
    var helper = this.setupHelper(paramSize, name);
    this.push(this.source.functionCall(helper.name, 'call', helper.callParams));
  },

  // [invokeAmbiguous]
  //
  // On stack, before: hash, inverse, program, params..., ...
  // On stack, after: result of disambiguation
  //
  // This operation is used when an expression like `{{foo}}`
  // is provided, but we don't know at compile-time whether it
  // is a helper or a path.
  //
  // This operation emits more code than the other options,
  // and can be avoided by passing the `knownHelpers` and
  // `knownHelpersOnly` flags at compile-time.
  invokeAmbiguous: function invokeAmbiguous(name, helperCall) {
    this.useRegister('helper');

    var nonHelper = this.popStack();

    this.emptyHash();
    var helper = this.setupHelper(0, name, helperCall);

    var helperName = this.lastHelper = this.nameLookup('helpers', name, 'helper');

    var lookup = ['(', '(helper = ', helperName, ' || ', nonHelper, ')'];
    if (!this.options.strict) {
      lookup[0] = '(helper = ';
      lookup.push(' != null ? helper : ', this.aliasable('helpers.helperMissing'));
    }

    this.push(['(', lookup, helper.paramsInit ? ['),(', helper.paramsInit] : [], '),', '(typeof helper === ', this.aliasable('"function"'), ' ? ', this.source.functionCall('helper', 'call', helper.callParams), ' : helper))']);
  },

  // [invokePartial]
  //
  // On stack, before: context, ...
  // On stack after: result of partial invocation
  //
  // This operation pops off a context, invokes a partial with that context,
  // and pushes the result of the invocation back.
  invokePartial: function invokePartial(isDynamic, name, indent) {
    var params = [],
        options = this.setupParams(name, 1, params);

    if (isDynamic) {
      name = this.popStack();
      delete options.name;
    }

    if (indent) {
      options.indent = JSON.stringify(indent);
    }
    options.helpers = 'helpers';
    options.partials = 'partials';
    options.decorators = 'container.decorators';

    if (!isDynamic) {
      params.unshift(this.nameLookup('partials', name, 'partial'));
    } else {
      params.unshift(name);
    }

    if (this.options.compat) {
      options.depths = 'depths';
    }
    options = this.objectLiteral(options);
    params.push(options);

    this.push(this.source.functionCall('container.invokePartial', '', params));
  },

  // [assignToHash]
  //
  // On stack, before: value, ..., hash, ...
  // On stack, after: ..., hash, ...
  //
  // Pops a value off the stack and assigns it to the current hash
  assignToHash: function assignToHash(key) {
    this.hash.values[key] = this.popStack();
  },

  // HELPERS

  compiler: JavaScriptCompiler,

  compileChildren: function compileChildren(environment, options) {
    var children = environment.children,
        child = undefined,
        compiler = undefined;

    for (var i = 0, l = children.length; i < l; i++) {
      child = children[i];
      compiler = new this.compiler(); // eslint-disable-line new-cap

      var index = this.matchExistingProgram(child);

      if (index == null) {
        this.context.programs.push(''); // Placeholder to prevent name conflicts for nested children
        index = this.context.programs.length;
        child.index = index;
        child.name = 'program' + index;
        this.context.programs[index] = compiler.compile(child, options, this.context, !this.precompile);
        this.context.decorators[index] = compiler.decorators;
        this.context.environments[index] = child;

        this.useDepths = this.useDepths || compiler.useDepths;
        this.useBlockParams = this.useBlockParams || compiler.useBlockParams;
      } else {
        child.index = index;
        child.name = 'program' + index;

        this.useDepths = this.useDepths || child.useDepths;
        this.useBlockParams = this.useBlockParams || child.useBlockParams;
      }
    }
  },
  matchExistingProgram: function matchExistingProgram(child) {
    for (var i = 0, len = this.context.environments.length; i < len; i++) {
      var environment = this.context.environments[i];
      if (environment && environment.equals(child)) {
        return i;
      }
    }
  },

  programExpression: function programExpression(guid) {
    var child = this.environment.children[guid],
        programParams = [child.index, 'data', child.blockParams];

    if (this.useBlockParams || this.useDepths) {
      programParams.push('blockParams');
    }
    if (this.useDepths) {
      programParams.push('depths');
    }

    return 'container.program(' + programParams.join(', ') + ')';
  },

  useRegister: function useRegister(name) {
    if (!this.registers[name]) {
      this.registers[name] = true;
      this.registers.list.push(name);
    }
  },

  push: function push(expr) {
    if (!(expr instanceof Literal)) {
      expr = this.source.wrap(expr);
    }

    this.inlineStack.push(expr);
    return expr;
  },

  pushStackLiteral: function pushStackLiteral(item) {
    this.push(new Literal(item));
  },

  pushSource: function pushSource(source) {
    if (this.pendingContent) {
      this.source.push(this.appendToBuffer(this.source.quotedString(this.pendingContent), this.pendingLocation));
      this.pendingContent = undefined;
    }

    if (source) {
      this.source.push(source);
    }
  },

  replaceStack: function replaceStack(callback) {
    var prefix = ['('],
        stack = undefined,
        createdStack = undefined,
        usedLiteral = undefined;

    /* istanbul ignore next */
    if (!this.isInline()) {
      throw new _exception2['default']('replaceStack on non-inline');
    }

    // We want to merge the inline statement into the replacement statement via ','
    var top = this.popStack(true);

    if (top instanceof Literal) {
      // Literals do not need to be inlined
      stack = [top.value];
      prefix = ['(', stack];
      usedLiteral = true;
    } else {
      // Get or create the current stack name for use by the inline
      createdStack = true;
      var _name = this.incrStack();

      prefix = ['((', this.push(_name), ' = ', top, ')'];
      stack = this.topStack();
    }

    var item = callback.call(this, stack);

    if (!usedLiteral) {
      this.popStack();
    }
    if (createdStack) {
      this.stackSlot--;
    }
    this.push(prefix.concat(item, ')'));
  },

  incrStack: function incrStack() {
    this.stackSlot++;
    if (this.stackSlot > this.stackVars.length) {
      this.stackVars.push('stack' + this.stackSlot);
    }
    return this.topStackName();
  },
  topStackName: function topStackName() {
    return 'stack' + this.stackSlot;
  },
  flushInline: function flushInline() {
    var inlineStack = this.inlineStack;
    this.inlineStack = [];
    for (var i = 0, len = inlineStack.length; i < len; i++) {
      var entry = inlineStack[i];
      /* istanbul ignore if */
      if (entry instanceof Literal) {
        this.compileStack.push(entry);
      } else {
        var stack = this.incrStack();
        this.pushSource([stack, ' = ', entry, ';']);
        this.compileStack.push(stack);
      }
    }
  },
  isInline: function isInline() {
    return this.inlineStack.length;
  },

  popStack: function popStack(wrapped) {
    var inline = this.isInline(),
        item = (inline ? this.inlineStack : this.compileStack).pop();

    if (!wrapped && item instanceof Literal) {
      return item.value;
    } else {
      if (!inline) {
        /* istanbul ignore next */
        if (!this.stackSlot) {
          throw new _exception2['default']('Invalid stack pop');
        }
        this.stackSlot--;
      }
      return item;
    }
  },

  topStack: function topStack() {
    var stack = this.isInline() ? this.inlineStack : this.compileStack,
        item = stack[stack.length - 1];

    /* istanbul ignore if */
    if (item instanceof Literal) {
      return item.value;
    } else {
      return item;
    }
  },

  contextName: function contextName(context) {
    if (this.useDepths && context) {
      return 'depths[' + context + ']';
    } else {
      return 'depth' + context;
    }
  },

  quotedString: function quotedString(str) {
    return this.source.quotedString(str);
  },

  objectLiteral: function objectLiteral(obj) {
    return this.source.objectLiteral(obj);
  },

  aliasable: function aliasable(name) {
    var ret = this.aliases[name];
    if (ret) {
      ret.referenceCount++;
      return ret;
    }

    ret = this.aliases[name] = this.source.wrap(name);
    ret.aliasable = true;
    ret.referenceCount = 1;

    return ret;
  },

  setupHelper: function setupHelper(paramSize, name, blockHelper) {
    var params = [],
        paramsInit = this.setupHelperArgs(name, paramSize, params, blockHelper);
    var foundHelper = this.nameLookup('helpers', name, 'helper'),
        callContext = this.aliasable(this.contextName(0) + ' != null ? ' + this.contextName(0) + ' : {}');

    return {
      params: params,
      paramsInit: paramsInit,
      name: foundHelper,
      callParams: [callContext].concat(params)
    };
  },

  setupParams: function setupParams(helper, paramSize, params) {
    var options = {},
        objectArgs = !params,
        param = undefined;

    if (objectArgs) {
      params = [];
    }

    options.name = this.quotedString(helper);
    options.hash = this.popStack();

    var inverse = this.popStack(),
        program = this.popStack();

    // Avoid setting fn and inverse if neither are set. This allows
    // helpers to do a check for `if (options.fn)`
    if (program || inverse) {
      options.fn = program || 'container.noop';
      options.inverse = inverse || 'container.noop';
    }

    // The parameters go on to the stack in order (making sure that they are evaluated in order)
    // so we need to pop them off the stack in reverse order
    var i = paramSize;
    while (i--) {
      param = this.popStack();
      params[i] = param;
    }

    if (objectArgs) {
      options.args = this.source.generateArray(params);
    }

    if (this.options.data) {
      options.data = 'data';
    }
    if (this.useBlockParams) {
      options.blockParams = 'blockParams';
    }
    return options;
  },

  setupHelperArgs: function setupHelperArgs(helper, paramSize, params, useRegister) {
    var options = this.setupParams(helper, paramSize, params);
    options = this.objectLiteral(options);
    if (useRegister) {
      this.useRegister('options');
      params.push('options');
      return ['options=', options];
    } else if (params) {
      params.push(options);
      return '';
    } else {
      return options;
    }
  }
};

(function () {
  var reservedWords = ('break else new var' + ' case finally return void' + ' catch for switch while' + ' continue function this with' + ' default if throw' + ' delete in try' + ' do instanceof typeof' + ' abstract enum int short' + ' boolean export interface static' + ' byte extends long super' + ' char final native synchronized' + ' class float package throws' + ' const goto private transient' + ' debugger implements protected volatile' + ' double import public let yield await' + ' null true false').split(' ');

  var compilerWords = JavaScriptCompiler.RESERVED_WORDS = {};

  for (var i = 0, l = reservedWords.length; i < l; i++) {
    compilerWords[reservedWords[i]] = true;
  }
})();

JavaScriptCompiler.isValidJavaScriptVariableName = function (name) {
  return !JavaScriptCompiler.RESERVED_WORDS[name] && /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(name);
};

function strictLookup(requireTerminal, compiler, parts, type) {
  var stack = compiler.popStack(),
      i = 0,
      len = parts.length;
  if (requireTerminal) {
    len--;
  }

  for (; i < len; i++) {
    stack = compiler.nameLookup(stack, parts[i], type);
  }

  if (requireTerminal) {
    return [compiler.aliasable('container.strict'), '(', stack, ', ', compiler.quotedString(parts[i]), ')'];
  } else {
    return stack;
  }
}

exports['default'] = JavaScriptCompiler;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2xpYi9oYW5kbGViYXJzL2NvbXBpbGVyL2phdmFzY3JpcHQtY29tcGlsZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7OztvQkFBb0QsU0FBUzs7eUJBQ3ZDLGNBQWM7Ozs7cUJBQ2QsVUFBVTs7dUJBQ1osWUFBWTs7OztBQUVoQyxTQUFTLE9BQU8sQ0FBQyxLQUFLLEVBQUU7QUFDdEIsTUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7Q0FDcEI7O0FBRUQsU0FBUyxrQkFBa0IsR0FBRyxFQUFFOztBQUVoQyxrQkFBa0IsQ0FBQyxTQUFTLEdBQUc7OztBQUc3QixZQUFVLEVBQUUsb0JBQVMsTUFBTSxFQUFFLElBQUksY0FBYTtBQUM1QyxRQUFJLGtCQUFrQixDQUFDLDZCQUE2QixDQUFDLElBQUksQ0FBQyxFQUFFO0FBQzFELGFBQU8sQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQzVCLE1BQU07QUFDTCxhQUFPLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0tBQ2pEO0dBQ0Y7QUFDRCxlQUFhLEVBQUUsdUJBQVMsSUFBSSxFQUFFO0FBQzVCLFdBQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGtCQUFrQixDQUFDLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztHQUN2RTs7QUFFRCxjQUFZLEVBQUUsd0JBQVc7QUFDdkIsUUFBTSxRQUFRLDBCQUFvQjtRQUM1QixRQUFRLEdBQUcsdUJBQWlCLFFBQVEsQ0FBQyxDQUFDO0FBQzVDLFdBQU8sQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7R0FDN0I7O0FBRUQsZ0JBQWMsRUFBRSx3QkFBUyxNQUFNLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRTs7QUFFbkQsUUFBSSxDQUFDLGVBQVEsTUFBTSxDQUFDLEVBQUU7QUFD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QUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0dBQ3BEOztBQUVELE1BQUksZUFBZSxFQUFFO0FBQ25CLFdBQU8sQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLGtCQUFrQixDQUFDLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztHQUN6RyxNQUFNO0FBQ0wsV0FBTyxLQUFLLENBQUM7R0FDZDtDQUNGOztxQkFFYyxrQkFBa0IiLCJmaWxlIjoiamF2YXNjcmlwdC1jb21waWxlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENPTVBJTEVSX1JFVklTSU9OLCBSRVZJU0lPTl9DSEFOR0VTIH0gZnJvbSAnLi4vYmFzZSc7XG5pbXBvcnQgRXhjZXB0aW9uIGZyb20gJy4uL2V4Y2VwdGlvbic7XG5pbXBvcnQge2lzQXJyYXl9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCBDb2RlR2VuIGZyb20gJy4vY29kZS1nZW4nO1xuXG5mdW5jdGlvbiBMaXRlcmFsKHZhbHVlKSB7XG4gIHRoaXMudmFsdWUgPSB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gSmF2YVNjcmlwdENvbXBpbGVyKCkge31cblxuSmF2YVNjcmlwdENvbXBpbGVyLnByb3RvdHlwZSA9IHtcbiAgLy8gUFVCTElDIEFQSTogWW91IGNhbiBvdmVycmlkZSB0aGVzZSBtZXRob2RzIGluIGEgc3ViY2xhc3MgdG8gcHJvdmlkZVxuICAvLyBhbHRlcm5hdGl2ZSBjb21waWxlZCBmb3JtcyBmb3IgbmFtZSBsb29rdXAgYW5kIGJ1ZmZlcmluZyBzZW1hbnRpY3NcbiAgbmFtZUxvb2t1cDogZnVuY3Rpb24ocGFyZW50LCBuYW1lLyogLCB0eXBlKi8pIHtcbiAgICBpZiAoSmF2YVNjcmlwdENvbXBpbGVyLmlzVmFsaWRKYXZhU2NyaXB0VmFyaWFibGVOYW1lKG5hbWUpKSB7XG4gICAgICByZXR1cm4gW3BhcmVudCwgJy4nLCBuYW1lXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFtwYXJlbnQsICdbJywgSlNPTi5zdHJpbmdpZnkobmFtZSksICddJ107XG4gICAgfVxuICB9LFxuICBkZXB0aGVkTG9va3VwOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIFt0aGlzLmFsaWFzYWJsZSgnY29udGFpbmVyLmxvb2t1cCcpLCAnKGRlcHRocywgXCInLCBuYW1lLCAnXCIpJ107XG4gIH0sXG5cbiAgY29tcGlsZXJJbmZvOiBmdW5jdGlvbigpIHtcbiAgICBjb25zdCByZXZpc2lvbiA9IENPTVBJTEVSX1JFVklTSU9OLFxuICAgICAgICAgIHZlcnNpb25zID0gUkVWSVNJT05fQ0hBTkdFU1tyZXZpc2lvbl07XG4gICAgcmV0dXJuIFtyZXZpc2lvbiwgdmVyc2lvbnNdO1xuICB9LFxuXG4gIGFwcGVuZFRvQnVmZmVyOiBmdW5jdGlvbihzb3VyY2UsIGxvY2F0aW9uLCBleHBsaWNpdCkge1xuICAgIC8vIEZvcmNlIGEgc291cmNlIGFzIHRoaXMgc2ltcGxpZmllcyB0aGUgbWVyZ2UgbG9naWMuXG4gICAgaWYgKCFpc0FycmF5KHNvdXJjZSkpIHtcbiAgICAgIHNvdXJjZSA9IFtzb3VyY2VdO1xuICAgIH1cbiAgICBzb3VyY2UgPSB0aGlzLnNvdXJjZS53cmFwKHNvdXJjZSwgbG9jYXRpb24pO1xuXG4gICAgaWYgKHRoaXMuZW52aXJvbm1lbnQuaXNTaW1wbGUpIHtcbiAgICAgIHJldHVybiBbJ3JldHVybiAnLCBzb3VyY2UsICc7J107XG4gICAgfSBlbHNlIGlmIChleHBsaWNpdCkge1xuICAgICAgLy8gVGhpcyBpcyBhIGNhc2Ugd2hlcmUgdGhlIGJ1ZmZlciBvcGVyYXRpb24gb2NjdXJzIGFzIGEgY2hpbGQgb2YgYW5vdGhlclxuICAgICAgLy8gY29uc3RydWN0LCBnZW5lcmFsbHkgYnJhY2VzLiBXZSBoYXZlIHRvIGV4cGxpY2l0bHkgb3V0cHV0IHRoZXNlIGJ1ZmZlclxuICAgICAgLy8gb3BlcmF0aW9ucyB0byBlbnN1cmUgdGhhdCB0aGUgZW1pdHRlZCBjb2RlIGdvZXMgaW4gdGhlIGNvcnJlY3QgbG9jYXRpb24uXG4gICAgICByZXR1cm4gWydidWZmZXIgKz0gJywgc291cmNlLCAnOyddO1xuICAgIH0gZWxzZSB7XG4gICAgICBzb3VyY2UuYXBwZW5kVG9CdWZmZXIgPSB0cnVlO1xuICAgICAgcmV0dXJuIHNvdXJjZTtcbiAgICB9XG4gIH0sXG5cbiAgaW5pdGlhbGl6ZUJ1ZmZlcjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMucXVvdGVkU3RyaW5nKCcnKTtcbiAgfSxcbiAgLy8gRU5EIFBVQkxJQyBBUElcblxuICBjb21waWxlOiBmdW5jdGlvbihlbnZpcm9ubWVudCwgb3B0aW9ucywgY29udGV4dCwgYXNPYmplY3QpIHtcbiAgICB0aGlzLmVudmlyb25tZW50ID0gZW52aXJvbm1lbnQ7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLnByZWNvbXBpbGUgPSAhYXNPYmplY3Q7XG5cbiAgICB0aGlzLm5hbWUgPSB0aGlzLmVudmlyb25tZW50Lm5hbWU7XG4gICAgdGhpcy5pc0NoaWxkID0gISFjb250ZXh0O1xuICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQgfHwge1xuICAgICAgZGVjb3JhdG9yczogW10sXG4gICAgICBwcm9ncmFtczogW10sXG4gICAgICBlbnZpcm9ubWVudHM6IFtdXG4gICAgfTtcblxuICAgIHRoaXMucHJlYW1ibGUoKTtcblxuICAgIHRoaXMuc3RhY2tTbG90ID0gMDtcbiAgICB0aGlzLnN0YWNrVmFycyA9IFtdO1xuICAgIHRoaXMuYWxpYXNlcyA9IHt9O1xuICAgIHRoaXMucmVnaXN0ZXJzID0geyBsaXN0OiBbXSB9O1xuICAgIHRoaXMuaGFzaGVzID0gW107XG4gICAgdGhpcy5jb21waWxlU3RhY2sgPSBbXTtcbiAgICB0aGlzLmlubGluZVN0YWNrID0gW107XG4gICAgdGhpcy5ibG9ja1BhcmFtcyA9IFtdO1xuXG4gICAgdGhpcy5jb21waWxlQ2hpbGRyZW4oZW52aXJvbm1lbnQsIG9wdGlvbnMpO1xuXG4gICAgdGhpcy51c2VEZXB0aHMgPSB0aGlzLnVzZURlcHRocyB8fCBlbnZpcm9ubWVudC51c2VEZXB0aHMgfHwgZW52aXJvbm1lbnQudXNlRGVjb3JhdG9ycyB8fCB0aGlzLm9wdGlvbnMuY29tcGF0O1xuICAgIHRoaXMudXNlQmxvY2tQYXJhbXMgPSB0aGlzLnVzZUJsb2NrUGFyYW1zIHx8IGVudmlyb25tZW50LnVzZUJsb2NrUGFyYW1zO1xuXG4gICAgbGV0IG9wY29kZXMgPSBlbnZpcm9ubWVudC5vcGNvZGVzLFxuICAgICAgICBvcGNvZGUsXG4gICAgICAgIGZpcnN0TG9jLFxuICAgICAgICBpLFxuICAgICAgICBsO1xuXG4gICAgZm9yIChpID0gMCwgbCA9IG9wY29kZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBvcGNvZGUgPSBvcGNvZGVzW2ldO1xuXG4gICAgICB0aGlzLnNvdXJjZS5jdXJyZW50TG9jYXRpb24gPSBvcGNvZGUubG9jO1xuICAgICAgZmlyc3RMb2MgPSBmaXJzdExvYyB8fCBvcGNvZGUubG9jO1xuICAgICAgdGhpc1tvcGNvZGUub3Bjb2RlXS5hcHBseSh0aGlzLCBvcGNvZGUuYXJncyk7XG4gICAgfVxuXG4gICAgLy8gRmx1c2ggYW55IHRyYWlsaW5nIGNvbnRlbnQgdGhhdCBtaWdodCBiZSBwZW5kaW5nLlxuICAgIHRoaXMuc291cmNlLmN1cnJlbnRMb2NhdGlvbiA9IGZpcnN0TG9jO1xuICAgIHRoaXMucHVzaFNvdXJjZSgnJyk7XG5cbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgIGlmICh0aGlzLnN0YWNrU2xvdCB8fCB0aGlzLmlubGluZVN0YWNrLmxlbmd0aCB8fCB0aGlzLmNvbXBpbGVTdGFjay5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBFeGNlcHRpb24oJ0NvbXBpbGUgY29tcGxldGVkIHdpdGggY29udGVudCBsZWZ0IG9uIHN0YWNrJyk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmRlY29yYXRvcnMuaXNFbXB0eSgpKSB7XG4gICAgICB0aGlzLnVzZURlY29yYXRvcnMgPSB0cnVlO1xuXG4gICAgICB0aGlzLmRlY29yYXRvcnMucHJlcGVuZCgndmFyIGRlY29yYXRvcnMgPSBjb250YWluZXIuZGVjb3JhdG9ycztcXG4nKTtcbiAgICAgIHRoaXMuZGVjb3JhdG9ycy5wdXNoKCdyZXR1cm4gZm47Jyk7XG5cbiAgICAgIGlmIChhc09iamVjdCkge1xuICAgICAgICB0aGlzLmRlY29yYXRvcnMgPSBGdW5jdGlvbi5hcHBseSh0aGlzLCBbJ2ZuJywgJ3Byb3BzJywgJ2NvbnRhaW5lcicsICdkZXB0aDAnLCAnZGF0YScsICdibG9ja1BhcmFtcycsICdkZXB0aHMnLCB0aGlzLmRlY29yYXRvcnMubWVyZ2UoKV0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5kZWNvcmF0b3JzLnByZXBlbmQoJ2Z1bmN0aW9uKGZuLCBwcm9wcywgY29udGFpbmVyLCBkZXB0aDAsIGRhdGEsIGJsb2NrUGFyYW1zLCBkZXB0aHMpIHtcXG4nKTtcbiAgICAgICAgdGhpcy5kZWNvcmF0b3JzLnB1c2goJ31cXG4nKTtcbiAgICAgICAgdGhpcy5kZWNvcmF0b3JzID0gdGhpcy5kZWNvcmF0b3JzLm1lcmdlKCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGVjb3JhdG9ycyA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBsZXQgZm4gPSB0aGlzLmNyZWF0ZUZ1bmN0aW9uQ29udGV4dChhc09iamVjdCk7XG4gICAgaWYgKCF0aGlzLmlzQ2hpbGQpIHtcbiAgICAgIGxldCByZXQgPSB7XG4gICAgICAgIGNvbXBpbGVyOiB0aGlzLmNvbXBpbGVySW5mbygpLFxuICAgICAgICBtYWluOiBmblxuICAgICAgfTtcblxuICAgICAgaWYgKHRoaXMuZGVjb3JhdG9ycykge1xuICAgICAgICByZXQubWFpbl9kID0gdGhpcy5kZWNvcmF0b3JzOyAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY2FtZWxjYXNlXG4gICAgICAgIHJldC51c2VEZWNvcmF0b3JzID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgbGV0IHtwcm9ncmFtcywgZGVjb3JhdG9yc30gPSB0aGlzLmNvbnRleHQ7XG4gICAgICBmb3IgKGkgPSAwLCBsID0gcHJvZ3JhbXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGlmIChwcm9ncmFtc1tpXSkge1xuICAgICAgICAgIHJldFtpXSA9IHByb2dyYW1zW2ldO1xuICAgICAgICAgIGlmIChkZWNvcmF0b3JzW2ldKSB7XG4gICAgICAgICAgICByZXRbaSArICdfZCddID0gZGVjb3JhdG9yc1tpXTtcbiAgICAgICAgICAgIHJldC51c2VEZWNvcmF0b3JzID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuZW52aXJvbm1lbnQudXNlUGFydGlhbCkge1xuICAgICAgICByZXQudXNlUGFydGlhbCA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmRhdGEpIHtcbiAgICAgICAgcmV0LnVzZURhdGEgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMudXNlRGVwdGhzKSB7XG4gICAgICAgIHJldC51c2VEZXB0aHMgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMudXNlQmxvY2tQYXJhbXMpIHtcbiAgICAgICAgcmV0LnVzZUJsb2NrUGFyYW1zID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuY29tcGF0KSB7XG4gICAgICAgIHJldC5jb21wYXQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWFzT2JqZWN0KSB7XG4gICAgICAgIHJldC5jb21waWxlciA9IEpTT04uc3RyaW5naWZ5KHJldC5jb21waWxlcik7XG5cbiAgICAgICAgdGhpcy5zb3VyY2UuY3VycmVudExvY2F0aW9uID0ge3N0YXJ0OiB7bGluZTogMSwgY29sdW1uOiAwfX07XG4gICAgICAgIHJldCA9IHRoaXMub2JqZWN0TGl0ZXJhbChyZXQpO1xuXG4gICAgICAgIGlmIChvcHRpb25zLnNyY05hbWUpIHtcbiAgICAgICAgICByZXQgPSByZXQudG9TdHJpbmdXaXRoU291cmNlTWFwKHtmaWxlOiBvcHRpb25zLmRlc3ROYW1lfSk7XG4gICAgICAgICAgcmV0Lm1hcCA9IHJldC5tYXAgJiYgcmV0Lm1hcC50b1N0cmluZygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldCA9IHJldC50b1N0cmluZygpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXQuY29tcGlsZXJPcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmV0O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZm47XG4gICAgfVxuICB9LFxuXG4gIHByZWFtYmxlOiBmdW5jdGlvbigpIHtcbiAgICAvLyB0cmFjayB0aGUgbGFzdCBjb250ZXh0IHB1c2hlZCBpbnRvIHBsYWNlIHRvIGFsbG93IHNraXBwaW5nIHRoZVxuICAgIC8vIGdldENvbnRleHQgb3Bjb2RlIHdoZW4gaXQgd291bGQgYmUgYSBub29wXG4gICAgdGhpcy5sYXN0Q29udGV4dCA9IDA7XG4gICAgdGhpcy5zb3VyY2UgPSBuZXcgQ29kZUdlbih0aGlzLm9wdGlvbnMuc3JjTmFtZSk7XG4gICAgdGhpcy5kZWNvcmF0b3JzID0gbmV3IENvZGVHZW4odGhpcy5vcHRpb25zLnNyY05hbWUpO1xuICB9LFxuXG4gIGNyZWF0ZUZ1bmN0aW9uQ29udGV4dDogZnVuY3Rpb24oYXNPYmplY3QpIHtcbiAgICBsZXQgdmFyRGVjbGFyYXRpb25zID0gJyc7XG5cbiAgICBsZXQgbG9jYWxzID0gdGhpcy5zdGFja1ZhcnMuY29uY2F0KHRoaXMucmVnaXN0ZXJzLmxpc3QpO1xuICAgIGlmIChsb2NhbHMubGVuZ3RoID4gMCkge1xuICAgICAgdmFyRGVjbGFyYXRpb25zICs9ICcsICcgKyBsb2NhbHMuam9pbignLCAnKTtcbiAgICB9XG5cbiAgICAvLyBHZW5lcmF0ZSBtaW5pbWl6ZXIgYWxpYXMgbWFwcGluZ3NcbiAgICAvL1xuICAgIC8vIFdoZW4gdXNpbmcgdHJ1ZSBTb3VyY2VOb2RlcywgdGhpcyB3aWxsIHVwZGF0ZSBhbGwgcmVmZXJlbmNlcyB0byB0aGUgZ2l2ZW4gYWxpYXNcbiAgICAvLyBhcyB0aGUgc291cmNlIG5vZGVzIGFyZSByZXVzZWQgaW4gc2l0dS4gRm9yIHRoZSBub24tc291cmNlIG5vZGUgY29tcGlsYXRpb24gbW9kZSxcbiAgICAvLyBhbGlhc2VzIHdpbGwgbm90IGJlIHVzZWQsIGJ1dCB0aGlzIGNhc2UgaXMgYWxyZWFkeSBiZWluZyBydW4gb24gdGhlIGNsaWVudCBhbmRcbiAgICAvLyB3ZSBhcmVuJ3QgY29uY2VybiBhYm91dCBtaW5pbWl6aW5nIHRoZSB0ZW1wbGF0ZSBzaXplLlxuICAgIGxldCBhbGlhc0NvdW50ID0gMDtcbiAgICBmb3IgKGxldCBhbGlhcyBpbiB0aGlzLmFsaWFzZXMpIHsgICAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBndWFyZC1mb3ItaW5cbiAgICAgIGxldCBub2RlID0gdGhpcy5hbGlhc2VzW2FsaWFzXTtcblxuICAgICAgaWYgKHRoaXMuYWxpYXNlcy5oYXNPd25Qcm9wZXJ0eShhbGlhcykgJiYgbm9kZS5jaGlsZHJlbiAmJiBub2RlLnJlZmVyZW5jZUNvdW50ID4gMSkge1xuICAgICAgICB2YXJEZWNsYXJhdGlvbnMgKz0gJywgYWxpYXMnICsgKCsrYWxpYXNDb3VudCkgKyAnPScgKyBhbGlhcztcbiAgICAgICAgbm9kZS5jaGlsZHJlblswXSA9ICdhbGlhcycgKyBhbGlhc0NvdW50O1xuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBwYXJhbXMgPSBbJ2NvbnRhaW5lcicsICdkZXB0aDAnLCAnaGVscGVycycsICdwYXJ0aWFscycsICdkYXRhJ107XG5cbiAgICBpZiAodGhpcy51c2VCbG9ja1BhcmFtcyB8fCB0aGlzLnVzZURlcHRocykge1xuICAgICAgcGFyYW1zLnB1c2goJ2Jsb2NrUGFyYW1zJyk7XG4gICAgfVxuICAgIGlmICh0aGlzLnVzZURlcHRocykge1xuICAgICAgcGFyYW1zLnB1c2goJ2RlcHRocycpO1xuICAgIH1cblxuICAgIC8vIFBlcmZvcm0gYSBzZWNvbmQgcGFzcyBvdmVyIHRoZSBvdXRwdXQgdG8gbWVyZ2UgY29udGVudCB3aGVuIHBvc3NpYmxlXG4gICAgbGV0IHNvdXJjZSA9IHRoaXMubWVyZ2VTb3VyY2UodmFyRGVjbGFyYXRpb25zKTtcblxuICAgIGlmIChhc09iamVjdCkge1xuICAgICAgcGFyYW1zLnB1c2goc291cmNlKTtcblxuICAgICAgcmV0dXJuIEZ1bmN0aW9uLmFwcGx5KHRoaXMsIHBhcmFtcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLnNvdXJjZS53cmFwKFsnZnVuY3Rpb24oJywgcGFyYW1zLmpvaW4oJywnKSwgJykge1xcbiAgJywgc291cmNlLCAnfSddKTtcbiAgICB9XG4gIH0sXG4gIG1lcmdlU291cmNlOiBmdW5jdGlvbih2YXJEZWNsYXJhdGlvbnMpIHtcbiAgICBsZXQgaXNTaW1wbGUgPSB0aGlzLmVudmlyb25tZW50LmlzU2ltcGxlLFxuICAgICAgICBhcHBlbmRPbmx5ID0gIXRoaXMuZm9yY2VCdWZmZXIsXG4gICAgICAgIGFwcGVuZEZpcnN0LFxuXG4gICAgICAgIHNvdXJjZVNlZW4sXG4gICAgICAgIGJ1ZmZlclN0YXJ0LFxuICAgICAgICBidWZmZXJFbmQ7XG4gICAgdGhpcy5zb3VyY2UuZWFjaCgobGluZSkgPT4ge1xuICAgICAgaWYgKGxpbmUuYXBwZW5kVG9CdWZmZXIpIHtcbiAgICAgICAgaWYgKGJ1ZmZlclN0YXJ0KSB7XG4gICAgICAgICAgbGluZS5wcmVwZW5kKCcgICsgJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYnVmZmVyU3RhcnQgPSBsaW5lO1xuICAgICAgICB9XG4gICAgICAgIGJ1ZmZlckVuZCA9IGxpbmU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoYnVmZmVyU3RhcnQpIHtcbiAgICAgICAgICBpZiAoIXNvdXJjZVNlZW4pIHtcbiAgICAgICAgICAgIGFwcGVuZEZpcnN0ID0gdHJ1ZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYnVmZmVyU3RhcnQucHJlcGVuZCgnYnVmZmVyICs9ICcpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBidWZmZXJFbmQuYWRkKCc7Jyk7XG4gICAgICAgICAgYnVmZmVyU3RhcnQgPSBidWZmZXJFbmQgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBzb3VyY2VTZWVuID0gdHJ1ZTtcbiAgICAgICAgaWYgKCFpc1NpbXBsZSkge1xuICAgICAgICAgIGFwcGVuZE9ubHkgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG5cbiAgICBpZiAoYXBwZW5kT25seSkge1xuICAgICAgaWYgKGJ1ZmZlclN0YXJ0KSB7XG4gICAgICAgIGJ1ZmZlclN0YXJ0LnByZXBlbmQoJ3JldHVybiAnKTtcbiAgICAgICAgYnVmZmVyRW5kLmFkZCgnOycpO1xuICAgICAgfSBlbHNlIGlmICghc291cmNlU2Vlbikge1xuICAgICAgICB0aGlzLnNvdXJjZS5wdXNoKCdyZXR1cm4gXCJcIjsnKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdmFyRGVjbGFyYXRpb25zICs9ICcsIGJ1ZmZlciA9ICcgKyAoYXBwZW5kRmlyc3QgPyAnJyA6IHRoaXMuaW5pdGlhbGl6ZUJ1ZmZlcigpKTtcblxuICAgICAgaWYgKGJ1ZmZlclN0YXJ0KSB7XG4gICAgICAgIGJ1ZmZlclN0YXJ0LnByZXBlbmQoJ3JldHVybiBidWZmZXIgKyAnKTtcbiAgICAgICAgYnVmZmVyRW5kLmFkZCgnOycpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zb3VyY2UucHVzaCgncmV0dXJuIGJ1ZmZlcjsnKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodmFyRGVjbGFyYXRpb25zKSB7XG4gICAgICB0aGlzLnNvdXJjZS5wcmVwZW5kKCd2YXIgJyArIHZhckRlY2xhcmF0aW9ucy5zdWJzdHJpbmcoMikgKyAoYXBwZW5kRmlyc3QgPyAnJyA6ICc7XFxuJykpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnNvdXJjZS5tZXJnZSgpO1xuICB9LFxuXG4gIC8vIFtibG9ja1ZhbHVlXVxuICAvL1xuICAvLyBPbiBzdGFjaywgYmVmb3JlOiBoYXNoLCBpbnZlcnNlLCBwcm9ncmFtLCB2YWx1ZVxuICAvLyBPbiBzdGFjaywgYWZ0ZXI6IHJldHVybiB2YWx1ZSBvZiBibG9ja0hlbHBlck1pc3NpbmdcbiAgLy9cbiAgLy8gVGhlIHB1cnBvc2Ugb2YgdGhpcyBvcGNvZGUgaXMgdG8gdGFrZSBhIGJsb2NrIG9mIHRoZSBmb3JtXG4gIC8vIGB7eyN0aGlzLmZvb319Li4ue3svdGhpcy5mb299fWAsIHJlc29sdmUgdGhlIHZhbHVlIG9mIGBmb29gLCBhbmRcbiAgLy8gcmVwbGFjZSBpdCBvbiB0aGUgc3RhY2sgd2l0aCB0aGUgcmVzdWx0IG9mIHByb3Blcmx5XG4gIC8vIGludm9raW5nIGJsb2NrSGVscGVyTWlzc2luZy5cbiAgYmxvY2tWYWx1ZTogZnVuY3Rpb24obmFtZSkge1xuICAgIGxldCBibG9ja0hlbHBlck1pc3NpbmcgPSB0aGlzLmFsaWFzYWJsZSgnaGVscGVycy5ibG9ja0hlbHBlck1pc3NpbmcnKSxcbiAgICAgICAgcGFyYW1zID0gW3RoaXMuY29udGV4dE5hbWUoMCldO1xuICAgIHRoaXMuc2V0dXBIZWxwZXJBcmdzKG5hbWUsIDAsIHBhcmFtcyk7XG5cbiAgICBsZXQgYmxvY2tOYW1lID0gdGhpcy5wb3BTdGFjaygpO1xuICAgIHBhcmFtcy5zcGxpY2UoMSwgMCwgYmxvY2tOYW1lKTtcblxuICAgIHRoaXMucHVzaCh0aGlzLnNvdXJjZS5mdW5jdGlvbkNhbGwoYmxvY2tIZWxwZXJNaXNzaW5nLCAnY2FsbCcsIHBhcmFtcykpO1xuICB9LFxuXG4gIC8vIFthbWJpZ3VvdXNCbG9ja1ZhbHVlXVxuICAvL1xuICAvLyBPbiBzdGFjaywgYmVmb3JlOiBoYXNoLCBpbnZlcnNlLCBwcm9ncmFtLCB2YWx1ZVxuICAvLyBDb21waWxlciB2YWx1ZSwgYmVmb3JlOiBsYXN0SGVscGVyPXZhbHVlIG9mIGxhc3QgZm91bmQgaGVscGVyLCBpZiBhbnlcbiAgLy8gT24gc3RhY2ssIGFmdGVyLCBpZiBubyBsYXN0SGVscGVyOiBzYW1lIGFzIFtibG9ja1ZhbHVlXVxuICAvLyBPbiBzdGFjaywgYWZ0ZXIsIGlmIGxhc3RIZWxwZXI6IHZhbHVlXG4gIGFtYmlndW91c0Jsb2NrVmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgIC8vIFdlJ3JlIGJlaW5nIGEgYml0IGNoZWVreSBhbmQgcmV1c2luZyB0aGUgb3B0aW9ucyB2YWx1ZSBmcm9tIHRoZSBwcmlvciBleGVjXG4gICAgbGV0IGJsb2NrSGVscGVyTWlzc2luZyA9IHRoaXMuYWxpYXNhYmxlKCdoZWxwZXJzLmJsb2NrSGVscGVyTWlzc2luZycpLFxuICAgICAgICBwYXJhbXMgPSBbdGhpcy5jb250ZXh0TmFtZSgwKV07XG4gICAgdGhpcy5zZXR1cEhlbHBlckFyZ3MoJycsIDAsIHBhcmFtcywgdHJ1ZSk7XG5cbiAgICB0aGlzLmZsdXNoSW5saW5lKCk7XG5cbiAgICBsZXQgY3VycmVudCA9IHRoaXMudG9wU3RhY2soKTtcbiAgICBwYXJhbXMuc3BsaWNlKDEsIDAsIGN1cnJlbnQpO1xuXG4gICAgdGhpcy5wdXNoU291cmNlKFtcbiAgICAgICAgJ2lmICghJywgdGhpcy5sYXN0SGVscGVyLCAnKSB7ICcsXG4gICAgICAgICAgY3VycmVudCwgJyA9ICcsIHRoaXMuc291cmNlLmZ1bmN0aW9uQ2FsbChibG9ja0hlbHBlck1pc3NpbmcsICdjYWxsJywgcGFyYW1zKSxcbiAgICAgICAgJ30nXSk7XG4gIH0sXG5cbiAgLy8gW2FwcGVuZENvbnRlbnRdXG4gIC8vXG4gIC8vIE9uIHN0YWNrLCBiZWZvcmU6IC4uLlxuICAvLyBPbiBzdGFjaywgYWZ0ZXI6IC4uLlxuICAvL1xuICAvLyBBcHBlbmRzIHRoZSBzdHJpbmcgdmFsdWUgb2YgYGNvbnRlbnRgIHRvIHRoZSBjdXJyZW50IGJ1ZmZlclxuICBhcHBlbmRDb250ZW50OiBmdW5jdGlvbihjb250ZW50KSB7XG4gICAgaWYgKHRoaXMucGVuZGluZ0NvbnRlbnQpIHtcbiAgICAgIGNvbnRlbnQgPSB0aGlzLnBlbmRpbmdDb250ZW50ICsgY29udGVudDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wZW5kaW5nTG9jYXRpb24gPSB0aGlzLnNvdXJjZS5jdXJyZW50TG9jYXRpb247XG4gICAgfVxuXG4gICAgdGhpcy5wZW5kaW5nQ29udGVudCA9IGNvbnRlbnQ7XG4gIH0sXG5cbiAgLy8gW2FwcGVuZF1cbiAgLy9cbiAgLy8gT24gc3RhY2ssIGJlZm9yZTogdmFsdWUsIC4uLlxuICAvLyBPbiBzdGFjaywgYWZ0ZXI6IC4uLlxuICAvL1xuICAvLyBDb2VyY2VzIGB2YWx1ZWAgdG8gYSBTdHJpbmcgYW5kIGFwcGVuZHMgaXQgdG8gdGhlIGN1cnJlbnQgYnVmZmVyLlxuICAvL1xuICAvLyBJZiBgdmFsdWVgIGlzIHRydXRoeSwgb3IgMCwgaXQgaXMgY29lcmNlZCBpbnRvIGEgc3RyaW5nIGFuZCBhcHBlbmRlZFxuICAvLyBPdGhlcndpc2UsIHRoZSBlbXB0eSBzdHJpbmcgaXMgYXBwZW5kZWRcbiAgYXBwZW5kOiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5pc0lubGluZSgpKSB7XG4gICAgICB0aGlzLnJlcGxhY2VTdGFjaygoY3VycmVudCkgPT4gWycgIT0gbnVsbCA/ICcsIGN1cnJlbnQsICcgOiBcIlwiJ10pO1xuXG4gICAgICB0aGlzLnB1c2hTb3VyY2UodGhpcy5hcHBlbmRUb0J1ZmZlcih0aGlzLnBvcFN0YWNrKCkpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IGxvY2FsID0gdGhpcy5wb3BTdGFjaygpO1xuICAgICAgdGhpcy5wdXNoU291cmNlKFsnaWYgKCcsIGxvY2FsLCAnICE9IG51bGwpIHsgJywgdGhpcy5hcHBlbmRUb0J1ZmZlcihsb2NhbCwgdW5kZWZpbmVkLCB0cnVlKSwgJyB9J10pO1xuICAgICAgaWYgKHRoaXMuZW52aXJvbm1lbnQuaXNTaW1wbGUpIHtcbiAgICAgICAgdGhpcy5wdXNoU291cmNlKFsnZWxzZSB7ICcsIHRoaXMuYXBwZW5kVG9CdWZmZXIoXCInJ1wiLCB1bmRlZmluZWQsIHRydWUpLCAnIH0nXSk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8vIFthcHBlbmRFc2NhcGVkXVxuICAvL1xuICAvLyBPbiBzdGFjaywgYmVmb3JlOiB2YWx1ZSwgLi4uXG4gIC8vIE9uIHN0YWNrLCBhZnRlcjogLi4uXG4gIC8vXG4gIC8vIEVzY2FwZSBgdmFsdWVgIGFuZCBhcHBlbmQgaXQgdG8gdGhlIGJ1ZmZlclxuICBhcHBlbmRFc2NhcGVkOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnB1c2hTb3VyY2UodGhpcy5hcHBlbmRUb0J1ZmZlcihcbiAgICAgICAgW3RoaXMuYWxpYXNhYmxlKCdjb250YWluZXIuZXNjYXBlRXhwcmVzc2lvbicpLCAnKCcsIHRoaXMucG9wU3RhY2soKSwgJyknXSkpO1xuICB9LFxuXG4gIC8vIFtnZXRDb250ZXh0XVxuICAvL1xuICAvLyBPbiBzdGFjaywgYmVmb3JlOiAuLi5cbiAgLy8gT24gc3RhY2ssIGFmdGVyOiAuLi5cbiAgLy8gQ29tcGlsZXIgdmFsdWUsIGFmdGVyOiBsYXN0Q29udGV4dD1kZXB0aFxuICAvL1xuICAvLyBTZXQgdGhlIHZhbHVlIG9mIHRoZSBgbGFzdENvbnRleHRgIGNvbXBpbGVyIHZhbHVlIHRvIHRoZSBkZXB0aFxuICBnZXRDb250ZXh0OiBmdW5jdGlvbihkZXB0aCkge1xuICAgIHRoaXMubGFzdENvbnRleHQgPSBkZXB0aDtcbiAgfSxcblxuICAvLyBbcHVzaENvbnRleHRdXG4gIC8vXG4gIC8vIE9uIHN0YWNrLCBiZWZvcmU6IC4uLlxuICAvLyBPbiBzdGFjaywgYWZ0ZXI6IGN1cnJlbnRDb250ZXh0LCAuLi5cbiAgLy9cbiAgLy8gUHVzaGVzIHRoZSB2YWx1ZSBvZiB0aGUgY3VycmVudCBjb250ZXh0IG9udG8gdGhlIHN0YWNrLlxuICBwdXNoQ29udGV4dDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5wdXNoU3RhY2tMaXRlcmFsKHRoaXMuY29udGV4dE5hbWUodGhpcy5sYXN0Q29udGV4dCkpO1xuICB9LFxuXG4gIC8vIFtsb29rdXBPbkNvbnRleHRdXG4gIC8vXG4gIC8vIE9uIHN0YWNrLCBiZWZvcmU6IC4uLlxuICAvLyBPbiBzdGFjaywgYWZ0ZXI6IGN1cnJlbnRDb250ZXh0W25hbWVdLCAuLi5cbiAgLy9cbiAgLy8gTG9va3MgdXAgdGhlIHZhbHVlIG9mIGBuYW1lYCBvbiB0aGUgY3VycmVudCBjb250ZXh0IGFuZCBwdXNoZXNcbiAgLy8gaXQgb250byB0aGUgc3RhY2suXG4gIGxvb2t1cE9uQ29udGV4dDogZnVuY3Rpb24ocGFydHMsIGZhbHN5LCBzdHJpY3QsIHNjb3BlZCkge1xuICAgIGxldCBpID0gMDtcblxuICAgIGlmICghc2NvcGVkICYmIHRoaXMub3B0aW9ucy5jb21wYXQgJiYgIXRoaXMubGFzdENvbnRleHQpIHtcbiAgICAgIC8vIFRoZSBkZXB0aGVkIHF1ZXJ5IGlzIGV4cGVjdGVkIHRvIGhhbmRsZSB0aGUgdW5kZWZpbmVkIGxvZ2ljIGZvciB0aGUgcm9vdCBsZXZlbCB0aGF0XG4gICAgICAvLyBpcyBpbXBsZW1lbnRlZCBiZWxvdywgc28gd2UgZXZhbHVhdGUgdGhhdCBkaXJlY3RseSBpbiBjb21wYXQgbW9kZVxuICAgICAgdGhpcy5wdXNoKHRoaXMuZGVwdGhlZExvb2t1cChwYXJ0c1tpKytdKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucHVzaENvbnRleHQoKTtcbiAgICB9XG5cbiAgICB0aGlzLnJlc29sdmVQYXRoKCdjb250ZXh0JywgcGFydHMsIGksIGZhbHN5LCBzdHJpY3QpO1xuICB9LFxuXG4gIC8vIFtsb29rdXBCbG9ja1BhcmFtXVxuICAvL1xuICAvLyBPbiBzdGFjaywgYmVmb3JlOiAuLi5cbiAgLy8gT24gc3RhY2ssIGFmdGVyOiBibG9ja1BhcmFtW25hbWVdLCAuLi5cbiAgLy9cbiAgLy8gTG9va3MgdXAgdGhlIHZhbHVlIG9mIGBwYXJ0c2Agb24gdGhlIGdpdmVuIGJsb2NrIHBhcmFtIGFuZCBwdXNoZXNcbiAgLy8gaXQgb250byB0aGUgc3RhY2suXG4gIGxvb2t1cEJsb2NrUGFyYW06IGZ1bmN0aW9uKGJsb2NrUGFyYW1JZCwgcGFydHMpIHtcbiAgICB0aGlzLnVzZUJsb2NrUGFyYW1zID0gdHJ1ZTtcblxuICAgIHRoaXMucHVzaChbJ2Jsb2NrUGFyYW1zWycsIGJsb2NrUGFyYW1JZFswXSwgJ11bJywgYmxvY2tQYXJhbUlkWzFdLCAnXSddKTtcbiAgICB0aGlzLnJlc29sdmVQYXRoKCdjb250ZXh0JywgcGFydHMsIDEpO1xuICB9LFxuXG4gIC8vIFtsb29rdXBEYXRhXVxuICAvL1xuICAvLyBPbiBzdGFjaywgYmVmb3JlOiAuLi5cbiAgLy8gT24gc3RhY2ssIGFmdGVyOiBkYXRhLCAuLi5cbiAgLy9cbiAgLy8gUHVzaCB0aGUgZGF0YSBsb29rdXAgb3BlcmF0b3JcbiAgbG9va3VwRGF0YTogZnVuY3Rpb24oZGVwdGgsIHBhcnRzLCBzdHJpY3QpIHtcbiAgICBpZiAoIWRlcHRoKSB7XG4gICAgICB0aGlzLnB1c2hTdGFja0xpdGVyYWwoJ2RhdGEnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wdXNoU3RhY2tMaXRlcmFsKCdjb250YWluZXIuZGF0YShkYXRhLCAnICsgZGVwdGggKyAnKScpO1xuICAgIH1cblxuICAgIHRoaXMucmVzb2x2ZVBhdGgoJ2RhdGEnLCBwYXJ0cywgMCwgdHJ1ZSwgc3RyaWN0KTtcbiAgfSxcblxuICByZXNvbHZlUGF0aDogZnVuY3Rpb24odHlwZSwgcGFydHMsIGksIGZhbHN5LCBzdHJpY3QpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLnN0cmljdCB8fCB0aGlzLm9wdGlvbnMuYXNzdW1lT2JqZWN0cykge1xuICAgICAgdGhpcy5wdXNoKHN0cmljdExvb2t1cCh0aGlzLm9wdGlvbnMuc3RyaWN0ICYmIHN0cmljdCwgdGhpcywgcGFydHMsIHR5cGUpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgbGVuID0gcGFydHMubGVuZ3RoO1xuICAgIGZvciAoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLWxvb3AtZnVuYyAqL1xuICAgICAgdGhpcy5yZXBsYWNlU3RhY2soKGN1cnJlbnQpID0+IHtcbiAgICAgICAgbGV0IGxvb2t1cCA9IHRoaXMubmFtZUxvb2t1cChjdXJyZW50LCBwYXJ0c1tpXSwgdHlwZSk7XG4gICAgICAgIC8vIFdlIHdhbnQgdG8gZW5zdXJlIHRoYXQgemVybyBhbmQgZmFsc2UgYXJlIGhhbmRsZWQgcHJvcGVybHkgaWYgdGhlIGNvbnRleHQgKGZhbHN5IGZsYWcpXG4gICAgICAgIC8vIG5lZWRzIHRvIGhhdmUgdGhlIHNwZWNpYWwgaGFuZGxpbmcgZm9yIHRoZXNlIHZhbHVlcy5cbiAgICAgICAgaWYgKCFmYWxzeSkge1xuICAgICAgICAgIHJldHVybiBbJyAhPSBudWxsID8gJywgbG9va3VwLCAnIDogJywgY3VycmVudF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gT3RoZXJ3aXNlIHdlIGNhbiB1c2UgZ2VuZXJpYyBmYWxzeSBoYW5kbGluZ1xuICAgICAgICAgIHJldHVybiBbJyAmJiAnLCBsb29rdXBdO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIC8qIGVzbGludC1lbmFibGUgbm8tbG9vcC1mdW5jICovXG4gICAgfVxuICB9LFxuXG4gIC8vIFtyZXNvbHZlUG9zc2libGVMYW1iZGFdXG4gIC8vXG4gIC8vIE9uIHN0YWNrLCBiZWZvcmU6IHZhbHVlLCAuLi5cbiAgLy8gT24gc3RhY2ssIGFmdGVyOiByZXNvbHZlZCB2YWx1ZSwgLi4uXG4gIC8vXG4gIC8vIElmIHRoZSBgdmFsdWVgIGlzIGEgbGFtYmRhLCByZXBsYWNlIGl0IG9uIHRoZSBzdGFjayBieVxuICAvLyB0aGUgcmV0dXJuIHZhbHVlIG9mIHRoZSBsYW1iZGFcbiAgcmVzb2x2ZVBvc3NpYmxlTGFtYmRhOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnB1c2goW3RoaXMuYWxpYXNhYmxlKCdjb250YWluZXIubGFtYmRhJyksICcoJywgdGhpcy5wb3BTdGFjaygpLCAnLCAnLCB0aGlzLmNvbnRleHROYW1lKDApLCAnKSddKTtcbiAgfSxcblxuICBlbXB0eUhhc2g6IGZ1bmN0aW9uKG9taXRFbXB0eSkge1xuICAgIHRoaXMucHVzaFN0YWNrTGl0ZXJhbChvbWl0RW1wdHkgPyAndW5kZWZpbmVkJyA6ICd7fScpO1xuICB9LFxuICBwdXNoSGFzaDogZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuaGFzaCkge1xuICAgICAgdGhpcy5oYXNoZXMucHVzaCh0aGlzLmhhc2gpO1xuICAgIH1cbiAgICB0aGlzLmhhc2ggPSB7dmFsdWVzOiBbXSwgdHlwZXM6IFtdLCBjb250ZXh0czogW10sIGlkczogW119O1xuICB9LFxuICBwb3BIYXNoOiBmdW5jdGlvbigpIHtcbiAgICBsZXQgaGFzaCA9IHRoaXMuaGFzaDtcbiAgICB0aGlzLmhhc2ggPSB0aGlzLmhhc2hlcy5wb3AoKTtcblxuICAgIHRoaXMucHVzaCh0aGlzLm9iamVjdExpdGVyYWwoaGFzaC52YWx1ZXMpKTtcbiAgfSxcblxuICAvLyBbcHVzaFN0cmluZ11cbiAgLy9cbiAgLy8gT24gc3RhY2ssIGJlZm9yZTogLi4uXG4gIC8vIE9uIHN0YWNrLCBhZnRlcjogcXVvdGVkU3RyaW5nKHN0cmluZyksIC4uLlxuICAvL1xuICAvLyBQdXNoIGEgcXVvdGVkIHZlcnNpb24gb2YgYHN0cmluZ2Agb250byB0aGUgc3RhY2tcbiAgcHVzaFN0cmluZzogZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgdGhpcy5wdXNoU3RhY2tMaXRlcmFsKHRoaXMucXVvdGVkU3RyaW5nKHN0cmluZykpO1xuICB9LFxuXG4gIC8vIFtwdXNoTGl0ZXJhbF1cbiAgLy9cbiAgLy8gT24gc3RhY2ssIGJlZm9yZTogLi4uXG4gIC8vIE9uIHN0YWNrLCBhZnRlcjogdmFsdWUsIC4uLlxuICAvL1xuICAvLyBQdXNoZXMgYSB2YWx1ZSBvbnRvIHRoZSBzdGFjay4gVGhpcyBvcGVyYXRpb24gcHJldmVudHNcbiAgLy8gdGhlIGNvbXBpbGVyIGZyb20gY3JlYXRpbmcgYSB0ZW1wb3JhcnkgdmFyaWFibGUgdG8gaG9sZFxuICAvLyBpdC5cbiAgcHVzaExpdGVyYWw6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgdGhpcy5wdXNoU3RhY2tMaXRlcmFsKHZhbHVlKTtcbiAgfSxcblxuICAvLyBbcHVzaFByb2dyYW1dXG4gIC8vXG4gIC8vIE9uIHN0YWNrLCBiZWZvcmU6IC4uLlxuICAvLyBPbiBzdGFjaywgYWZ0ZXI6IHByb2dyYW0oZ3VpZCksIC4uLlxuICAvL1xuICAvLyBQdXNoIGEgcHJvZ3JhbSBleHByZXNzaW9uIG9udG8gdGhlIHN0YWNrLiBUaGlzIHRha2VzXG4gIC8vIGEgY29tcGlsZS10aW1lIGd1aWQgYW5kIGNvbnZlcnRzIGl0IGludG8gYSBydW50aW1lLWFjY2Vzc2libGVcbiAgLy8gZXhwcmVzc2lvbi5cbiAgcHVzaFByb2dyYW06IGZ1bmN0aW9uKGd1aWQpIHtcbiAgICBpZiAoZ3VpZCAhPSBudWxsKSB7XG4gICAgICB0aGlzLnB1c2hTdGFja0xpdGVyYWwodGhpcy5wcm9ncmFtRXhwcmVzc2lvbihndWlkKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucHVzaFN0YWNrTGl0ZXJhbChudWxsKTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gW3JlZ2lzdGVyRGVjb3JhdG9yXVxuICAvL1xuICAvLyBPbiBzdGFjaywgYmVmb3JlOiBoYXNoLCBwcm9ncmFtLCBwYXJhbXMuLi4sIC4uLlxuICAvLyBPbiBzdGFjaywgYWZ0ZXI6IC4uLlxuICAvL1xuICAvLyBQb3BzIG9mZiB0aGUgZGVjb3JhdG9yJ3MgcGFyYW1ldGVycywgaW52b2tlcyB0aGUgZGVjb3JhdG9yLFxuICAvLyBhbmQgaW5zZXJ0cyB0aGUgZGVjb3JhdG9yIGludG8gdGhlIGRlY29yYXRvcnMgbGlzdC5cbiAgcmVnaXN0ZXJEZWNvcmF0b3IocGFyYW1TaXplLCBuYW1lKSB7XG4gICAgbGV0IGZvdW5kRGVjb3JhdG9yID0gdGhpcy5uYW1lTG9va3VwKCdkZWNvcmF0b3JzJywgbmFtZSwgJ2RlY29yYXRvcicpLFxuICAgICAgICBvcHRpb25zID0gdGhpcy5zZXR1cEhlbHBlckFyZ3MobmFtZSwgcGFyYW1TaXplKTtcblxuICAgIHRoaXMuZGVjb3JhdG9ycy5wdXNoKFtcbiAgICAgICdmbiA9ICcsXG4gICAgICB0aGlzLmRlY29yYXRvcnMuZnVuY3Rpb25DYWxsKGZvdW5kRGVjb3JhdG9yLCAnJywgWydmbicsICdwcm9wcycsICdjb250YWluZXInLCBvcHRpb25zXSksXG4gICAgICAnIHx8IGZuOydcbiAgICBdKTtcbiAgfSxcblxuICAvLyBbaW52b2tlSGVscGVyXVxuICAvL1xuICAvLyBPbiBzdGFjaywgYmVmb3JlOiBoYXNoLCBpbnZlcnNlLCBwcm9ncmFtLCBwYXJhbXMuLi4sIC4uLlxuICAvLyBPbiBzdGFjaywgYWZ0ZXI6IHJlc3VsdCBvZiBoZWxwZXIgaW52b2NhdGlvblxuICAvL1xuICAvLyBQb3BzIG9mZiB0aGUgaGVscGVyJ3MgcGFyYW1ldGVycywgaW52b2tlcyB0aGUgaGVscGVyLFxuICAvLyBhbmQgcHVzaGVzIHRoZSBoZWxwZXIncyByZXR1cm4gdmFsdWUgb250byB0aGUgc3RhY2suXG4gIC8vXG4gIC8vIElmIHRoZSBoZWxwZXIgaXMgbm90IGZvdW5kLCBgaGVscGVyTWlzc2luZ2AgaXMgY2FsbGVkLlxuICBpbnZva2VIZWxwZXI6IGZ1bmN0aW9uKHBhcmFtU2l6ZSwgbmFtZSwgaXNTaW1wbGUpIHtcbiAgICBsZXQgbm9uSGVscGVyID0gdGhpcy5wb3BTdGFjaygpLFxuICAgICAgICBoZWxwZXIgPSB0aGlzLnNldHVwSGVscGVyKHBhcmFtU2l6ZSwgbmFtZSksXG4gICAgICAgIHNpbXBsZSA9IGlzU2ltcGxlID8gW2hlbHBlci5uYW1lLCAnIHx8ICddIDogJyc7XG5cbiAgICBsZXQgbG9va3VwID0gWycoJ10uY29uY2F0KHNpbXBsZSwgbm9uSGVscGVyKTtcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5zdHJpY3QpIHtcbiAgICAgIGxvb2t1cC5wdXNoKCcgfHwgJywgdGhpcy5hbGlhc2FibGUoJ2hlbHBlcnMuaGVscGVyTWlzc2luZycpKTtcbiAgICB9XG4gICAgbG9va3VwLnB1c2goJyknKTtcblxuICAgIHRoaXMucHVzaCh0aGlzLnNvdXJjZS5mdW5jdGlvbkNhbGwobG9va3VwLCAnY2FsbCcsIGhlbHBlci5jYWxsUGFyYW1zKSk7XG4gIH0sXG5cbiAgLy8gW2ludm9rZUtub3duSGVscGVyXVxuICAvL1xuICAvLyBPbiBzdGFjaywgYmVmb3JlOiBoYXNoLCBpbnZlcnNlLCBwcm9ncmFtLCBwYXJhbXMuLi4sIC4uLlxuICAvLyBPbiBzdGFjaywgYWZ0ZXI6IHJlc3VsdCBvZiBoZWxwZXIgaW52b2NhdGlvblxuICAvL1xuICAvLyBUaGlzIG9wZXJhdGlvbiBpcyB1c2VkIHdoZW4gdGhlIGhlbHBlciBpcyBrbm93biB0byBleGlzdCxcbiAgLy8gc28gYSBgaGVscGVyTWlzc2luZ2AgZmFsbGJhY2sgaXMgbm90IHJlcXVpcmVkLlxuICBpbnZva2VLbm93bkhlbHBlcjogZnVuY3Rpb24ocGFyYW1TaXplLCBuYW1lKSB7XG4gICAgbGV0IGhlbHBlciA9IHRoaXMuc2V0dXBIZWxwZXIocGFyYW1TaXplLCBuYW1lKTtcbiAgICB0aGlzLnB1c2godGhpcy5zb3VyY2UuZnVuY3Rpb25DYWxsKGhlbHBlci5uYW1lLCAnY2FsbCcsIGhlbHBlci5jYWxsUGFyYW1zKSk7XG4gIH0sXG5cbiAgLy8gW2ludm9rZUFtYmlndW91c11cbiAgLy9cbiAgLy8gT24gc3RhY2ssIGJlZm9yZTogaGFzaCwgaW52ZXJzZSwgcHJvZ3JhbSwgcGFyYW1zLi4uLCAuLi5cbiAgLy8gT24gc3RhY2ssIGFmdGVyOiByZXN1bHQgb2YgZGlzYW1iaWd1YXRpb25cbiAgLy9cbiAgLy8gVGhpcyBvcGVyYXRpb24gaXMgdXNlZCB3aGVuIGFuIGV4cHJlc3Npb24gbGlrZSBge3tmb299fWBcbiAgLy8gaXMgcHJvdmlkZWQsIGJ1dCB3ZSBkb24ndCBrbm93IGF0IGNvbXBpbGUtdGltZSB3aGV0aGVyIGl0XG4gIC8vIGlzIGEgaGVscGVyIG9yIGEgcGF0aC5cbiAgLy9cbiAgLy8gVGhpcyBvcGVyYXRpb24gZW1pdHMgbW9yZSBjb2RlIHRoYW4gdGhlIG90aGVyIG9wdGlvbnMsXG4gIC8vIGFuZCBjYW4gYmUgYXZvaWRlZCBieSBwYXNzaW5nIHRoZSBga25vd25IZWxwZXJzYCBhbmRcbiAgLy8gYGtub3duSGVscGVyc09ubHlgIGZsYWdzIGF0IGNvbXBpbGUtdGltZS5cbiAgaW52b2tlQW1iaWd1b3VzOiBmdW5jdGlvbihuYW1lLCBoZWxwZXJDYWxsKSB7XG4gICAgdGhpcy51c2VSZWdpc3RlcignaGVscGVyJyk7XG5cbiAgICBsZXQgbm9uSGVscGVyID0gdGhpcy5wb3BTdGFjaygpO1xuXG4gICAgdGhpcy5lbXB0eUhhc2goKTtcbiAgICBsZXQgaGVscGVyID0gdGhpcy5zZXR1cEhlbHBlcigwLCBuYW1lLCBoZWxwZXJDYWxsKTtcblxuICAgIGxldCBoZWxwZXJOYW1lID0gdGhpcy5sYXN0SGVscGVyID0gdGhpcy5uYW1lTG9va3VwKCdoZWxwZXJzJywgbmFtZSwgJ2hlbHBlcicpO1xuXG4gICAgbGV0IGxvb2t1cCA9IFsnKCcsICcoaGVscGVyID0gJywgaGVscGVyTmFtZSwgJyB8fCAnLCBub25IZWxwZXIsICcpJ107XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMuc3RyaWN0KSB7XG4gICAgICBsb29rdXBbMF0gPSAnKGhlbHBlciA9ICc7XG4gICAgICBsb29rdXAucHVzaChcbiAgICAgICAgJyAhPSBudWxsID8gaGVscGVyIDogJyxcbiAgICAgICAgdGhpcy5hbGlhc2FibGUoJ2hlbHBlcnMuaGVscGVyTWlzc2luZycpXG4gICAgICApO1xuICAgIH1cblxuICAgIHRoaXMucHVzaChbXG4gICAgICAgICcoJywgbG9va3VwLFxuICAgICAgICAoaGVscGVyLnBhcmFtc0luaXQgPyBbJyksKCcsIGhlbHBlci5wYXJhbXNJbml0XSA6IFtdKSwgJyksJyxcbiAgICAgICAgJyh0eXBlb2YgaGVscGVyID09PSAnLCB0aGlzLmFsaWFzYWJsZSgnXCJmdW5jdGlvblwiJyksICcgPyAnLFxuICAgICAgICB0aGlzLnNvdXJjZS5mdW5jdGlvbkNhbGwoJ2hlbHBlcicsICdjYWxsJywgaGVscGVyLmNhbGxQYXJhbXMpLCAnIDogaGVscGVyKSknXG4gICAgXSk7XG4gIH0sXG5cbiAgLy8gW2ludm9rZVBhcnRpYWxdXG4gIC8vXG4gIC8vIE9uIHN0YWNrLCBiZWZvcmU6IGNvbnRleHQsIC4uLlxuICAvLyBPbiBzdGFjayBhZnRlcjogcmVzdWx0IG9mIHBhcnRpYWwgaW52b2NhdGlvblxuICAvL1xuICAvLyBUaGlzIG9wZXJhdGlvbiBwb3BzIG9mZiBhIGNvbnRleHQsIGludm9rZXMgYSBwYXJ0aWFsIHdpdGggdGhhdCBjb250ZXh0LFxuICAvLyBhbmQgcHVzaGVzIHRoZSByZXN1bHQgb2YgdGhlIGludm9jYXRpb24gYmFjay5cbiAgaW52b2tlUGFydGlhbDogZnVuY3Rpb24oaXNEeW5hbWljLCBuYW1lLCBpbmRlbnQpIHtcbiAgICBsZXQgcGFyYW1zID0gW10sXG4gICAgICAgIG9wdGlvbnMgPSB0aGlzLnNldHVwUGFyYW1zKG5hbWUsIDEsIHBhcmFtcyk7XG5cbiAgICBpZiAoaXNEeW5hbWljKSB7XG4gICAgICBuYW1lID0gdGhpcy5wb3BTdGFjaygpO1xuICAgICAgZGVsZXRlIG9wdGlvbnMubmFtZTtcbiAgICB9XG5cbiAgICBpZiAoaW5kZW50KSB7XG4gICAgICBvcHRpb25zLmluZGVudCA9IEpTT04uc3RyaW5naWZ5KGluZGVudCk7XG4gICAgfVxuICAgIG9wdGlvbnMuaGVscGVycyA9ICdoZWxwZXJzJztcbiAgICBvcHRpb25zLnBhcnRpYWxzID0gJ3BhcnRpYWxzJztcbiAgICBvcHRpb25zLmRlY29yYXRvcnMgPSAnY29udGFpbmVyLmRlY29yYXRvcnMnO1xuXG4gICAgaWYgKCFpc0R5bmFtaWMpIHtcbiAgICAgIHBhcmFtcy51bnNoaWZ0KHRoaXMubmFtZUxvb2t1cCgncGFydGlhbHMnLCBuYW1lLCAncGFydGlhbCcpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcGFyYW1zLnVuc2hpZnQobmFtZSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jb21wYXQpIHtcbiAgICAgIG9wdGlvbnMuZGVwdGhzID0gJ2RlcHRocyc7XG4gICAgfVxuICAgIG9wdGlvbnMgPSB0aGlzLm9iamVjdExpdGVyYWwob3B0aW9ucyk7XG4gICAgcGFyYW1zLnB1c2gob3B0aW9ucyk7XG5cbiAgICB0aGlzLnB1c2godGhpcy5zb3VyY2UuZnVuY3Rpb25DYWxsKCdjb250YWluZXIuaW52b2tlUGFydGlhbCcsICcnLCBwYXJhbXMpKTtcbiAgfSxcblxuICAvLyBbYXNzaWduVG9IYXNoXVxuICAvL1xuICAvLyBPbiBzdGFjaywgYmVmb3JlOiB2YWx1ZSwgLi4uLCBoYXNoLCAuLi5cbiAgLy8gT24gc3RhY2ssIGFmdGVyOiAuLi4sIGhhc2gsIC4uLlxuICAvL1xuICAvLyBQb3BzIGEgdmFsdWUgb2ZmIHRoZSBzdGFjayBhbmQgYXNzaWducyBpdCB0byB0aGUgY3VycmVudCBoYXNoXG4gIGFzc2lnblRvSGFzaDogZnVuY3Rpb24oa2V5KSB7XG4gICAgdGhpcy5oYXNoLnZhbHVlc1trZXldID0gdGhpcy5wb3BTdGFjaygpO1xuICB9LFxuXG4gIC8vIEhFTFBFUlNcblxuICBjb21waWxlcjogSmF2YVNjcmlwdENvbXBpbGVyLFxuXG4gIGNvbXBpbGVDaGlsZHJlbjogZnVuY3Rpb24oZW52aXJvbm1lbnQsIG9wdGlvbnMpIHtcbiAgICBsZXQgY2hpbGRyZW4gPSBlbnZpcm9ubWVudC5jaGlsZHJlbiwgY2hpbGQsIGNvbXBpbGVyO1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIGwgPSBjaGlsZHJlbi5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgICBjb21waWxlciA9IG5ldyB0aGlzLmNvbXBpbGVyKCk7ICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbmV3LWNhcFxuXG4gICAgICBsZXQgaW5kZXggPSB0aGlzLm1hdGNoRXhpc3RpbmdQcm9ncmFtKGNoaWxkKTtcblxuICAgICAgaWYgKGluZGV4ID09IG51bGwpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0LnByb2dyYW1zLnB1c2goJycpOyAgICAgLy8gUGxhY2Vob2xkZXIgdG8gcHJldmVudCBuYW1lIGNvbmZsaWN0cyBmb3IgbmVzdGVkIGNoaWxkcmVuXG4gICAgICAgIGluZGV4ID0gdGhpcy5jb250ZXh0LnByb2dyYW1zLmxlbmd0aDtcbiAgICAgICAgY2hpbGQuaW5kZXggPSBpbmRleDtcbiAgICAgICAgY2hpbGQubmFtZSA9ICdwcm9ncmFtJyArIGluZGV4O1xuICAgICAgICB0aGlzLmNvbnRleHQucHJvZ3JhbXNbaW5kZXhdID0gY29tcGlsZXIuY29tcGlsZShjaGlsZCwgb3B0aW9ucywgdGhpcy5jb250ZXh0LCAhdGhpcy5wcmVjb21waWxlKTtcbiAgICAgICAgdGhpcy5jb250ZXh0LmRlY29yYXRvcnNbaW5kZXhdID0gY29tcGlsZXIuZGVjb3JhdG9ycztcbiAgICAgICAgdGhpcy5jb250ZXh0LmVudmlyb25tZW50c1tpbmRleF0gPSBjaGlsZDtcblxuICAgICAgICB0aGlzLnVzZURlcHRocyA9IHRoaXMudXNlRGVwdGhzIHx8IGNvbXBpbGVyLnVzZURlcHRocztcbiAgICAgICAgdGhpcy51c2VCbG9ja1BhcmFtcyA9IHRoaXMudXNlQmxvY2tQYXJhbXMgfHwgY29tcGlsZXIudXNlQmxvY2tQYXJhbXM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjaGlsZC5pbmRleCA9IGluZGV4O1xuICAgICAgICBjaGlsZC5uYW1lID0gJ3Byb2dyYW0nICsgaW5kZXg7XG5cbiAgICAgICAgdGhpcy51c2VEZXB0aHMgPSB0aGlzLnVzZURlcHRocyB8fCBjaGlsZC51c2VEZXB0aHM7XG4gICAgICAgIHRoaXMudXNlQmxvY2tQYXJhbXMgPSB0aGlzLnVzZUJsb2NrUGFyYW1zIHx8IGNoaWxkLnVzZUJsb2NrUGFyYW1zO1xuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgbWF0Y2hFeGlzdGluZ1Byb2dyYW06IGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHRoaXMuY29udGV4dC5lbnZpcm9ubWVudHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGxldCBlbnZpcm9ubWVudCA9IHRoaXMuY29udGV4dC5lbnZpcm9ubWVudHNbaV07XG4gICAgICBpZiAoZW52aXJvbm1lbnQgJiYgZW52aXJvbm1lbnQuZXF1YWxzKGNoaWxkKSkge1xuICAgICAgICByZXR1cm4gaTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgcHJvZ3JhbUV4cHJlc3Npb246IGZ1bmN0aW9uKGd1aWQpIHtcbiAgICBsZXQgY2hpbGQgPSB0aGlzLmVudmlyb25tZW50LmNoaWxkcmVuW2d1aWRdLFxuICAgICAgICBwcm9ncmFtUGFyYW1zID0gW2NoaWxkLmluZGV4LCAnZGF0YScsIGNoaWxkLmJsb2NrUGFyYW1zXTtcblxuICAgIGlmICh0aGlzLnVzZUJsb2NrUGFyYW1zIHx8IHRoaXMudXNlRGVwdGhzKSB7XG4gICAgICBwcm9ncmFtUGFyYW1zLnB1c2goJ2Jsb2NrUGFyYW1zJyk7XG4gICAgfVxuICAgIGlmICh0aGlzLnVzZURlcHRocykge1xuICAgICAgcHJvZ3JhbVBhcmFtcy5wdXNoKCdkZXB0aHMnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gJ2NvbnRhaW5lci5wcm9ncmFtKCcgKyBwcm9ncmFtUGFyYW1zLmpvaW4oJywgJykgKyAnKSc7XG4gIH0sXG5cbiAgdXNlUmVnaXN0ZXI6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBpZiAoIXRoaXMucmVnaXN0ZXJzW25hbWVdKSB7XG4gICAgICB0aGlzLnJlZ2lzdGVyc1tuYW1lXSA9IHRydWU7XG4gICAgICB0aGlzLnJlZ2lzdGVycy5saXN0LnB1c2gobmFtZSk7XG4gICAgfVxuICB9LFxuXG4gIHB1c2g6IGZ1bmN0aW9uKGV4cHIpIHtcbiAgICBpZiAoIShleHByIGluc3RhbmNlb2YgTGl0ZXJhbCkpIHtcbiAgICAgIGV4cHIgPSB0aGlzLnNvdXJjZS53cmFwKGV4cHIpO1xuICAgIH1cblxuICAgIHRoaXMuaW5saW5lU3RhY2sucHVzaChleHByKTtcbiAgICByZXR1cm4gZXhwcjtcbiAgfSxcblxuICBwdXNoU3RhY2tMaXRlcmFsOiBmdW5jdGlvbihpdGVtKSB7XG4gICAgdGhpcy5wdXNoKG5ldyBMaXRlcmFsKGl0ZW0pKTtcbiAgfSxcblxuICBwdXNoU291cmNlOiBmdW5jdGlvbihzb3VyY2UpIHtcbiAgICBpZiAodGhpcy5wZW5kaW5nQ29udGVudCkge1xuICAgICAgdGhpcy5zb3VyY2UucHVzaChcbiAgICAgICAgICB0aGlzLmFwcGVuZFRvQnVmZmVyKHRoaXMuc291cmNlLnF1b3RlZFN0cmluZyh0aGlzLnBlbmRpbmdDb250ZW50KSwgdGhpcy5wZW5kaW5nTG9jYXRpb24pKTtcbiAgICAgIHRoaXMucGVuZGluZ0NvbnRlbnQgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgaWYgKHNvdXJjZSkge1xuICAgICAgdGhpcy5zb3VyY2UucHVzaChzb3VyY2UpO1xuICAgIH1cbiAgfSxcblxuICByZXBsYWNlU3RhY2s6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgbGV0IHByZWZpeCA9IFsnKCddLFxuICAgICAgICBzdGFjayxcbiAgICAgICAgY3JlYXRlZFN0YWNrLFxuICAgICAgICB1c2VkTGl0ZXJhbDtcblxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgaWYgKCF0aGlzLmlzSW5saW5lKCkpIHtcbiAgICAgIHRocm93IG5ldyBFeGNlcHRpb24oJ3JlcGxhY2VTdGFjayBvbiBub24taW5saW5lJyk7XG4gICAgfVxuXG4gICAgLy8gV2Ugd2FudCB0byBtZXJnZSB0aGUgaW5saW5lIHN0YXRlbWVudCBpbnRvIHRoZSByZXBsYWNlbWVudCBzdGF0ZW1lbnQgdmlhICcsJ1xuICAgIGxldCB0b3AgPSB0aGlzLnBvcFN0YWNrKHRydWUpO1xuXG4gICAgaWYgKHRvcCBpbnN0YW5jZW9mIExpdGVyYWwpIHtcbiAgICAgIC8vIExpdGVyYWxzIGRvIG5vdCBuZWVkIHRvIGJlIGlubGluZWRcbiAgICAgIHN0YWNrID0gW3RvcC52YWx1ZV07XG4gICAgICBwcmVmaXggPSBbJygnLCBzdGFja107XG4gICAgICB1c2VkTGl0ZXJhbCA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEdldCBvciBjcmVhdGUgdGhlIGN1cnJlbnQgc3RhY2sgbmFtZSBmb3IgdXNlIGJ5IHRoZSBpbmxpbmVcbiAgICAgIGNyZWF0ZWRTdGFjayA9IHRydWU7XG4gICAgICBsZXQgbmFtZSA9IHRoaXMuaW5jclN0YWNrKCk7XG5cbiAgICAgIHByZWZpeCA9IFsnKCgnLCB0aGlzLnB1c2gobmFtZSksICcgPSAnLCB0b3AsICcpJ107XG4gICAgICBzdGFjayA9IHRoaXMudG9wU3RhY2soKTtcbiAgICB9XG5cbiAgICBsZXQgaXRlbSA9IGNhbGxiYWNrLmNhbGwodGhpcywgc3RhY2spO1xuXG4gICAgaWYgKCF1c2VkTGl0ZXJhbCkge1xuICAgICAgdGhpcy5wb3BTdGFjaygpO1xuICAgIH1cbiAgICBpZiAoY3JlYXRlZFN0YWNrKSB7XG4gICAgICB0aGlzLnN0YWNrU2xvdC0tO1xuICAgIH1cbiAgICB0aGlzLnB1c2gocHJlZml4LmNvbmNhdChpdGVtLCAnKScpKTtcbiAgfSxcblxuICBpbmNyU3RhY2s6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc3RhY2tTbG90Kys7XG4gICAgaWYgKHRoaXMuc3RhY2tTbG90ID4gdGhpcy5zdGFja1ZhcnMubGVuZ3RoKSB7IHRoaXMuc3RhY2tWYXJzLnB1c2goJ3N0YWNrJyArIHRoaXMuc3RhY2tTbG90KTsgfVxuICAgIHJldHVybiB0aGlzLnRvcFN0YWNrTmFtZSgpO1xuICB9LFxuICB0b3BTdGFja05hbWU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAnc3RhY2snICsgdGhpcy5zdGFja1Nsb3Q7XG4gIH0sXG4gIGZsdXNoSW5saW5lOiBmdW5jdGlvbigpIHtcbiAgICBsZXQgaW5saW5lU3RhY2sgPSB0aGlzLmlubGluZVN0YWNrO1xuICAgIHRoaXMuaW5saW5lU3RhY2sgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gaW5saW5lU3RhY2subGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGxldCBlbnRyeSA9IGlubGluZVN0YWNrW2ldO1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgICBpZiAoZW50cnkgaW5zdGFuY2VvZiBMaXRlcmFsKSB7XG4gICAgICAgIHRoaXMuY29tcGlsZVN0YWNrLnB1c2goZW50cnkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IHN0YWNrID0gdGhpcy5pbmNyU3RhY2soKTtcbiAgICAgICAgdGhpcy5wdXNoU291cmNlKFtzdGFjaywgJyA9ICcsIGVudHJ5LCAnOyddKTtcbiAgICAgICAgdGhpcy5jb21waWxlU3RhY2sucHVzaChzdGFjayk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuICBpc0lubGluZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuaW5saW5lU3RhY2subGVuZ3RoO1xuICB9LFxuXG4gIHBvcFN0YWNrOiBmdW5jdGlvbih3cmFwcGVkKSB7XG4gICAgbGV0IGlubGluZSA9IHRoaXMuaXNJbmxpbmUoKSxcbiAgICAgICAgaXRlbSA9IChpbmxpbmUgPyB0aGlzLmlubGluZVN0YWNrIDogdGhpcy5jb21waWxlU3RhY2spLnBvcCgpO1xuXG4gICAgaWYgKCF3cmFwcGVkICYmIChpdGVtIGluc3RhbmNlb2YgTGl0ZXJhbCkpIHtcbiAgICAgIHJldHVybiBpdGVtLnZhbHVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIWlubGluZSkge1xuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICBpZiAoIXRoaXMuc3RhY2tTbG90KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEV4Y2VwdGlvbignSW52YWxpZCBzdGFjayBwb3AnKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN0YWNrU2xvdC0tO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGl0ZW07XG4gICAgfVxuICB9LFxuXG4gIHRvcFN0YWNrOiBmdW5jdGlvbigpIHtcbiAgICBsZXQgc3RhY2sgPSAodGhpcy5pc0lubGluZSgpID8gdGhpcy5pbmxpbmVTdGFjayA6IHRoaXMuY29tcGlsZVN0YWNrKSxcbiAgICAgICAgaXRlbSA9IHN0YWNrW3N0YWNrLmxlbmd0aCAtIDFdO1xuXG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgaWYgKGl0ZW0gaW5zdGFuY2VvZiBMaXRlcmFsKSB7XG4gICAgICByZXR1cm4gaXRlbS52YWx1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGl0ZW07XG4gICAgfVxuICB9LFxuXG4gIGNvbnRleHROYW1lOiBmdW5jdGlvbihjb250ZXh0KSB7XG4gICAgaWYgKHRoaXMudXNlRGVwdGhzICYmIGNvbnRleHQpIHtcbiAgICAgIHJldHVybiAnZGVwdGhzWycgKyBjb250ZXh0ICsgJ10nO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJ2RlcHRoJyArIGNvbnRleHQ7XG4gICAgfVxuICB9LFxuXG4gIHF1b3RlZFN0cmluZzogZnVuY3Rpb24oc3RyKSB7XG4gICAgcmV0dXJuIHRoaXMuc291cmNlLnF1b3RlZFN0cmluZyhzdHIpO1xuICB9LFxuXG4gIG9iamVjdExpdGVyYWw6IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiB0aGlzLnNvdXJjZS5vYmplY3RMaXRlcmFsKG9iaik7XG4gIH0sXG5cbiAgYWxpYXNhYmxlOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgbGV0IHJldCA9IHRoaXMuYWxpYXNlc1tuYW1lXTtcbiAgICBpZiAocmV0KSB7XG4gICAgICByZXQucmVmZXJlbmNlQ291bnQrKztcbiAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgcmV0ID0gdGhpcy5hbGlhc2VzW25hbWVdID0gdGhpcy5zb3VyY2Uud3JhcChuYW1lKTtcbiAgICByZXQuYWxpYXNhYmxlID0gdHJ1ZTtcbiAgICByZXQucmVmZXJlbmNlQ291bnQgPSAxO1xuXG4gICAgcmV0dXJuIHJldDtcbiAgfSxcblxuICBzZXR1cEhlbHBlcjogZnVuY3Rpb24ocGFyYW1TaXplLCBuYW1lLCBibG9ja0hlbHBlcikge1xuICAgIGxldCBwYXJhbXMgPSBbXSxcbiAgICAgICAgcGFyYW1zSW5pdCA9IHRoaXMuc2V0dXBIZWxwZXJBcmdzKG5hbWUsIHBhcmFtU2l6ZSwgcGFyYW1zLCBibG9ja0hlbHBlcik7XG4gICAgbGV0IGZvdW5kSGVscGVyID0gdGhpcy5uYW1lTG9va3VwKCdoZWxwZXJzJywgbmFtZSwgJ2hlbHBlcicpLFxuICAgICAgICBjYWxsQ29udGV4dCA9IHRoaXMuYWxpYXNhYmxlKGAke3RoaXMuY29udGV4dE5hbWUoMCl9ICE9IG51bGwgPyAke3RoaXMuY29udGV4dE5hbWUoMCl9IDoge31gKTtcblxuICAgIHJldHVybiB7XG4gICAgICBwYXJhbXM6IHBhcmFtcyxcbiAgICAgIHBhcmFtc0luaXQ6IHBhcmFtc0luaXQsXG4gICAgICBuYW1lOiBmb3VuZEhlbHBlcixcbiAgICAgIGNhbGxQYXJhbXM6IFtjYWxsQ29udGV4dF0uY29uY2F0KHBhcmFtcylcbiAgICB9O1xuICB9LFxuXG4gIHNldHVwUGFyYW1zOiBmdW5jdGlvbihoZWxwZXIsIHBhcmFtU2l6ZSwgcGFyYW1zKSB7XG4gICAgbGV0IG9wdGlvbnMgPSB7fSxcbiAgICAgICAgb2JqZWN0QXJncyA9ICFwYXJhbXMsXG4gICAgICAgIHBhcmFtO1xuXG4gICAgaWYgKG9iamVjdEFyZ3MpIHtcbiAgICAgIHBhcmFtcyA9IFtdO1xuICAgIH1cblxuICAgIG9wdGlvbnMubmFtZSA9IHRoaXMucXVvdGVkU3RyaW5nKGhlbHBlcik7XG4gICAgb3B0aW9ucy5oYXNoID0gdGhpcy5wb3BTdGFjaygpO1xuXG4gICAgbGV0IGludmVyc2UgPSB0aGlzLnBvcFN0YWNrKCksXG4gICAgICAgIHByb2dyYW0gPSB0aGlzLnBvcFN0YWNrKCk7XG5cbiAgICAvLyBBdm9pZCBzZXR0aW5nIGZuIGFuZCBpbnZlcnNlIGlmIG5laXRoZXIgYXJlIHNldC4gVGhpcyBhbGxvd3NcbiAgICAvLyBoZWxwZXJzIHRvIGRvIGEgY2hlY2sgZm9yIGBpZiAob3B0aW9ucy5mbilgXG4gICAgaWYgKHByb2dyYW0gfHwgaW52ZXJzZSkge1xuICAgICAgb3B0aW9ucy5mbiA9IHByb2dyYW0gfHwgJ2NvbnRhaW5lci5ub29wJztcbiAgICAgIG9wdGlvbnMuaW52ZXJzZSA9IGludmVyc2UgfHwgJ2NvbnRhaW5lci5ub29wJztcbiAgICB9XG5cbiAgICAvLyBUaGUgcGFyYW1ldGVycyBnbyBvbiB0byB0aGUgc3RhY2sgaW4gb3JkZXIgKG1ha2luZyBzdXJlIHRoYXQgdGhleSBhcmUgZXZhbHVhdGVkIGluIG9yZGVyKVxuICAgIC8vIHNvIHdlIG5lZWQgdG8gcG9wIHRoZW0gb2ZmIHRoZSBzdGFjayBpbiByZXZlcnNlIG9yZGVyXG4gICAgbGV0IGkgPSBwYXJhbVNpemU7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgcGFyYW0gPSB0aGlzLnBvcFN0YWNrKCk7XG4gICAgICBwYXJhbXNbaV0gPSBwYXJhbTtcbiAgICB9XG5cbiAgICBpZiAob2JqZWN0QXJncykge1xuICAgICAgb3B0aW9ucy5hcmdzID0gdGhpcy5zb3VyY2UuZ2VuZXJhdGVBcnJheShwYXJhbXMpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMuZGF0YSkge1xuICAgICAgb3B0aW9ucy5kYXRhID0gJ2RhdGEnO1xuICAgIH1cbiAgICBpZiAodGhpcy51c2VCbG9ja1BhcmFtcykge1xuICAgICAgb3B0aW9ucy5ibG9ja1BhcmFtcyA9ICdibG9ja1BhcmFtcyc7XG4gICAgfVxuICAgIHJldHVybiBvcHRpb25zO1xuICB9LFxuXG4gIHNldHVwSGVscGVyQXJnczogZnVuY3Rpb24oaGVscGVyLCBwYXJhbVNpemUsIHBhcmFtcywgdXNlUmVnaXN0ZXIpIHtcbiAgICBsZXQgb3B0aW9ucyA9IHRoaXMuc2V0dXBQYXJhbXMoaGVscGVyLCBwYXJhbVNpemUsIHBhcmFtcyk7XG4gICAgb3B0aW9ucyA9IHRoaXMub2JqZWN0TGl0ZXJhbChvcHRpb25zKTtcbiAgICBpZiAodXNlUmVnaXN0ZXIpIHtcbiAgICAgIHRoaXMudXNlUmVnaXN0ZXIoJ29wdGlvbnMnKTtcbiAgICAgIHBhcmFtcy5wdXNoKCdvcHRpb25zJyk7XG4gICAgICByZXR1cm4gWydvcHRpb25zPScsIG9wdGlvbnNdO1xuICAgIH0gZWxzZSBpZiAocGFyYW1zKSB7XG4gICAgICBwYXJhbXMucHVzaChvcHRpb25zKTtcbiAgICAgIHJldHVybiAnJztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG9wdGlvbnM7XG4gICAgfVxuICB9XG59O1xuXG5cbihmdW5jdGlvbigpIHtcbiAgY29uc3QgcmVzZXJ2ZWRXb3JkcyA9IChcbiAgICAnYnJlYWsgZWxzZSBuZXcgdmFyJyArXG4gICAgJyBjYXNlIGZpbmFsbHkgcmV0dXJuIHZvaWQnICtcbiAgICAnIGNhdGNoIGZvciBzd2l0Y2ggd2hpbGUnICtcbiAgICAnIGNvbnRpbnVlIGZ1bmN0aW9uIHRoaXMgd2l0aCcgK1xuICAgICcgZGVmYXVsdCBpZiB0aHJvdycgK1xuICAgICcgZGVsZXRlIGluIHRyeScgK1xuICAgICcgZG8gaW5zdGFuY2VvZiB0eXBlb2YnICtcbiAgICAnIGFic3RyYWN0IGVudW0gaW50IHNob3J0JyArXG4gICAgJyBib29sZWFuIGV4cG9ydCBpbnRlcmZhY2Ugc3RhdGljJyArXG4gICAgJyBieXRlIGV4dGVuZHMgbG9uZyBzdXBlcicgK1xuICAgICcgY2hhciBmaW5hbCBuYXRpdmUgc3luY2hyb25pemVkJyArXG4gICAgJyBjbGFzcyBmbG9hdCBwYWNrYWdlIHRocm93cycgK1xuICAgICcgY29uc3QgZ290byBwcml2YXRlIHRyYW5zaWVudCcgK1xuICAgICcgZGVidWdnZXIgaW1wbGVtZW50cyBwcm90ZWN0ZWQgdm9sYXRpbGUnICtcbiAgICAnIGRvdWJsZSBpbXBvcnQgcHVibGljIGxldCB5aWVsZCBhd2FpdCcgK1xuICAgICcgbnVsbCB0cnVlIGZhbHNlJ1xuICApLnNwbGl0KCcgJyk7XG5cbiAgY29uc3QgY29tcGlsZXJXb3JkcyA9IEphdmFTY3JpcHRDb21waWxlci5SRVNFUlZFRF9XT1JEUyA9IHt9O1xuXG4gIGZvciAobGV0IGkgPSAwLCBsID0gcmVzZXJ2ZWRXb3Jkcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBjb21waWxlcldvcmRzW3Jlc2VydmVkV29yZHNbaV1dID0gdHJ1ZTtcbiAgfVxufSgpKTtcblxuSmF2YVNjcmlwdENvbXBpbGVyLmlzVmFsaWRKYXZhU2NyaXB0VmFyaWFibGVOYW1lID0gZnVuY3Rpb24obmFtZSkge1xuICByZXR1cm4gIUphdmFTY3JpcHRDb21waWxlci5SRVNFUlZFRF9XT1JEU1tuYW1lXSAmJiAoL15bYS16QS1aXyRdWzAtOWEtekEtWl8kXSokLykudGVzdChuYW1lKTtcbn07XG5cbmZ1bmN0aW9uIHN0cmljdExvb2t1cChyZXF1aXJlVGVybWluYWwsIGNvbXBpbGVyLCBwYXJ0cywgdHlwZSkge1xuICBsZXQgc3RhY2sgPSBjb21waWxlci5wb3BTdGFjaygpLFxuICAgICAgaSA9IDAsXG4gICAgICBsZW4gPSBwYXJ0cy5sZW5ndGg7XG4gIGlmIChyZXF1aXJlVGVybWluYWwpIHtcbiAgICBsZW4tLTtcbiAgfVxuXG4gIGZvciAoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBzdGFjayA9IGNvbXBpbGVyLm5hbWVMb29rdXAoc3RhY2ssIHBhcnRzW2ldLCB0eXBlKTtcbiAgfVxuXG4gIGlmIChyZXF1aXJlVGVybWluYWwpIHtcbiAgICByZXR1cm4gW2NvbXBpbGVyLmFsaWFzYWJsZSgnY29udGFpbmVyLnN0cmljdCcpLCAnKCcsIHN0YWNrLCAnLCAnLCBjb21waWxlci5xdW90ZWRTdHJpbmcocGFydHNbaV0pLCAnKSddO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdGFjaztcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBKYXZhU2NyaXB0Q29tcGlsZXI7XG4iXX0=
