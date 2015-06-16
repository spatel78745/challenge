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
}

var Tokenizer = function(str) {
  this.lexemes = str.split(" ");
  this.index = 0;

  this.getToken = function() {
    var that = this;

    if (that.index >= that.lexemes.length) return { type: "EOF", val: "" };

    var lexeme = that.lexemes[that.index];
    var c = lexeme.charAt(0);

    if      (c == '&') token = { type: "AND", val: ""     };
    else if (c == '|') token = { type: "OR" , val: ""     };
    else               token = { type: "STR", val: lexeme };

    that.index++;

    return token;
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

var pattern = "to & be & not";
var token = { type: "", val: "" };
tokenizer = new Tokenizer(pattern);

while(token.type != "EOF") {
  token = tokenizer.getToken();
  console.log("token: " + token.type + " val: " + token.val);
}
