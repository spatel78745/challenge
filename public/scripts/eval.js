if (typeof Object.create !== "function") {
  Object.create = function(o) {
    var F = function() {};
    F.prototype = o;
    return new F();
  }
};

var AndExp = function(op1, op2) {
  this.op1 = op1;
  this.op2 = op2;
  this.eval = function(context) {
    var that = this;

    return that.op1.eval(context) && that.op2.eval(context);
  }
};

var OrExp = function(op1, op2) {
  this.op1 = op1;
  this.op2 = op2;

  this.eval = function(context) {
    var that = this;

    return that.op1.eval(context) || that.op2.eval(context);
  }
};

var StrExp = function(op1) {
  this.op1 = op1;

  this.eval = function(context) {
    var that = this;

    return context.search(that.op1) != -1
  }

  this.getOps = function() {
    var that = this;

    return that.op1;
  }
}

var TrueExp = function() {
  this.eval = function(context) {
    return true;
  }
}

var Tokenizer = function(str) {
  this.str = str;
  this.lexemes = str.split(" ");
  this.index = 0;

  this.peek = function() {
    var that = this;

    if (that.index >= that.lexemes.length) return { type: "EOF", val: "" };

    var lexeme = that.lexemes[that.index];
    var c = lexeme.charAt(0);

    if      (c == '&') token = { type: "AND"   , val: "&"    } ;
    else if (c == '|') token = { type: "OR"    , val: "|"    } ;
    else if (c == '(') token = { type: "OPEN"  , val: "("    } ;
    else if (c == ')') token = { type: "CLOSE" , val: ")"    } ;
    else               token = { type: "STR"   , val: lexeme } ;

    return token;
  }

  this.get = function() {
    var that = this;

    token = that.peek();
    if (token.type != "EOF") that.index++;

    return token;
  }

  this.getStr = function() {
    var that = this;

    return that.str;
  }
}

function makeMatcher(tokenizer)
{
  token = tokenizer.get();
  console.log("token: " + token.type + " " + token.val);
  if (token.type != "STR") {
    console.log("Error: expected string, got [ " + token.val + " ]");
    return new TrueExp;
  }

  subExp = new StrExp(token.val);
  console.log("new StrExp: " + subExp.getOps());

  lookahead = tokenizer.peek();
  console.log("lookahead: " + lookahead.type + " " + lookahead.val);

  if (lookahead.type == "EOF") 
  {
    console.log("No more tokens");
    return subExp;
  }

  tokenizer.get();

  if (lookahead.type == "STR" || lookahead.type == "AND" ) {
    return new AndExp(subExp, makeMatcher(tokenizer));
  }

  if (lookahead.type == "OR") {
    return new OrExp(subExp , makeMatcher(tokenizer));
  }
}

var context = "to be or not to be that is the question, whether tis nobler in the mind to suffer the slings and"

var s1 = new StrExp("question");
var s2 = new StrExp("111");
var s3 = new StrExp("333");
var s4 = new StrExp("222");

var a1 = new AndExp(s1, s2);
console.log("s1 && s2: " + a1.eval(context));

var o1 = new OrExp(s1, s2);
console.log("s1 || s2: " +  o1.eval(context));

var o2 = new OrExp(s3, s4);
console.log("s3 || s4: " +  o2.eval(context));

var a2 = new AndExp(o1, o2);
console.log("o1 && o2: " +  a2.eval(context));

var pattern = "to & be | ass";
var token = { type: "", val: "" };

tokenizer = new Tokenizer(pattern);
matcher = makeMatcher(tokenizer);

console.log("Made matcher: " + matcher);

console.log("Does it match? " + matcher.eval(context));

//matcher.eval(context);

//while(token.type != "EOF") {
//  token = tokenizer.get();
//  console.log("token: " + token.type + " val: " + token.val);
//}
