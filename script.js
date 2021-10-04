class Workbench {
  textarea = document.querySelector("#input textarea");
  output = document.querySelector("#output");
  runButton = document.querySelector("#run");
  clearButton = document.querySelector("#clear");

  constructor() {
    this.runButton.onclick = () => this.run();
    this.clearButton.onclick = () => this.clearOutput();
    console.log = (...args) => this.print(...args);

    this.textarea.addEventListener("keydown", (event) => {
      // console.log(event.key);
      switch (event.key) {
        case "Tab":
          event.preventDefault();
          replaceSelection(this.textarea, "  ");
          break;
        case "(":
          replaceSelection(this.textarea, ")", 1);
          break;
        case "{":
          replaceSelection(this.textarea, "}", 1);
          break;
        case "[":
          replaceSelection(this.textarea, "]", 1);
          break;
        case '"':
        case "'":
        case "`":
          replaceSelection(this.textarea, event.key, 1);
          break;
        case "Backspace":
          let { value, selectionEnd, selectionStart } = this.textarea;
          // console.log(value[selectionStart - 1]);
          // console.log(value[selectionEnd]);
          // console.log(selectionStart, selectionEnd);
          if (
            selectionEnd == selectionStart &&
            complements(value[selectionStart - 1], value[selectionEnd])
          ) {
            // console.log("replacing");
            this.textarea.value =
              value.slice(0, selectionStart) + value.slice(selectionEnd + 1);
            // Put the cursor back where it should be
            this.textarea.selectionStart = selectionStart;
            this.textarea.selectionEnd = selectionEnd;
          }

          break;
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.ctrlKey && event.key == "Enter") {
        event.preventDefault();
        this.run();
      }
    });
  }

  run() {
    let input = this.textarea.value;
    // console.log(input);
    try {
      let code = Function("", input);
      code();
    } catch (e) {
      this.print(e);
    }
  }
  print() {
    let paragraph = document.createElement("div");
    for (let argument of arguments) {
      paragraph.innerHTML += valueAsHTML(argument) + " ";
    }
    this.output.append(paragraph);
    paragraph.scrollIntoView();
  }
  clearOutput() {
    this.output.innerText = "";
  }
}

let workbench = new Workbench();

/**
 *
 * @param {HTMLTextAreaElement} field
 * @param {string} word
 * @param {number} spaceToLeaveAtFromEnd
 */
function replaceSelection(field, word, spaceToLeaveAtFromEnd = 0) {
  let from = field.selectionStart,
    to = field.selectionEnd;
  field.value = field.value.slice(0, from) + word + field.value.slice(to);

  // Put the cursor after the word
  field.selectionStart = from + word.length - spaceToLeaveAtFromEnd;
  field.selectionEnd = from + word.length - spaceToLeaveAtFromEnd;
}

function complements(first, second) {
  return (
    (first == "[" && second == "]") ||
    (first == "{" && second == "}") ||
    (first == "(" && second == ")") ||
    (first == "'" && second == "'") ||
    (first == '"' && second == '"') ||
    (first == "`" && second == "`")
  );
}

function valueAsHTML(object, tabspace = "\n", underObject = false) {
  switch (typeof object) {
    case "object":
      if (object === null) {
        return "<span class='null'>null</span>";
      } else if (object instanceof RegExp) {
        return "<span class='RegExp'>" + object + "</span>";
      } else if (object instanceof Error) {
        const callstack =
          object instanceof SyntaxError
            ? ""
            : "\n  Callstack:" +
              object.stack
                .trim()
                .split("\n")
                .slice(0, object.stack.trim().split("\n").length - 2)
                .map((line) => line.split("").reverse().join(""))
                .map((line) => /(\d+:\d+:)/g.exec(line))
                .filter((lineMatch) => lineMatch != null)
                .map((lineMatch) => lineMatch.pop())
                .map((lineMatch) => lineMatch.split("").reverse().join(""))
                .reduce(
                  (prev, curr) =>
                    prev +
                    "\n    at line " +
                    curr.replace(
                      /:(\d+):/,
                      Number(curr.match(/:(\d+):/)[1]) - 2 + ":"
                    ),
                  ""
                );

        let errorLineMsg = "";

        const match = /Callstack:\s+at line (\d+):(\d+)/.exec(callstack);
        if (match) {
          // console.log(match);
          // console.log(callstack);
          // console.log(object.stack);

          const [_, _line, _char] = match;

          const line = Number(_line),
            char = Number(_char);

          errorLineMsg =
            "  " +
            line +
            "| " +
            document.querySelector("textarea").value.split("\n")[line - 1] +
            "\n    ";

          for (let i = 0; i < line.toString().length + char - 1; i++) {
            errorLineMsg += " ";
          }

          errorLineMsg += "^";
        }

        // console.log(object.stack);
        return (
          "<span class='error'>" +
          object.toString() +
          (match ? "\n\n" + errorLineMsg + "\n" : "") +
          callstack +
          "</span>"
        );
      } else if ((type = determineTypedArray(object))) {
        // const type = determineTypedArray(object);
        return (
          type.asString +
          "(" +
          object.length +
          ") " +
          valueAsHTML(Array.from(object), tabspace, underObject)
        );
      } else if (object instanceof ArrayBuffer) {
        return "ArrayBuffer(" + object.byteLength + ")";
      } else if (Array.isArray(object)) {
        let spacer = some(object, (element) => {
          return typeof element == "object";
        })
          ? tabspace + "  "
          : " ";

        let string =
          "[" +
          (object.length > 5 && spacer != tabspace + "  "
            ? tabspace + " "
            : "");

        for (let i = 0; i < object.length; i++) {
          if (i == 100) {
            string +=
              tabspace + "  ... " + (object.length - 100) + " more elements ";
            break;
          }
          let element = object[i];
          if (typeof element == "object") {
            string +=
              (spacer == " " && i % 10 == 0 && i != 0
                ? tabspace + "  "
                : spacer) +
              valueAsHTML(element, tabspace + "  ", true) +
              ",";
          } else {
            string +=
              (spacer == " " && i % 10 == 0 && i != 0
                ? tabspace + "  "
                : spacer) +
              valueAsHTML(element, undefined, true) +
              ",";
          }
        }

        if (string[string.length - 1] == ",") {
          string = string.slice(0, string.length - 1);
        }

        string +=
          (spacer == " " && object.length < 6 ? spacer : tabspace) + "]";
        return string;
      } else {
        let string = "{";

        let spacer = some(object, (element) => {
          return typeof element == "object";
        })
          ? tabspace + "  "
          : " ";

        for (let key of Object.keys(object)) {
          if (typeof object[key] == "object") {
            string +=
              spacer +
              key +
              ": " +
              valueAsHTML(object[key], tabspace + "  ", true) +
              ",";
          } else {
            string +=
              spacer +
              key +
              ": " +
              valueAsHTML(object[key], undefined, true) +
              ",";
          }
        }

        if (string[string.length - 1] == ",") {
          string = string.slice(0, string.length - 1);
        }

        string += (spacer == " " ? spacer : tabspace) + "}";
        return string;
      }
    case "function":
      return '<span class="function">' + object.toString() + "</span>";
    case "number":
    case "bigint":
    case "boolean":
      return "<span class='numberOrBoolean'>" + object.toString() + "</span>";
    case "string":
      return (
        "<span class='string'>" +
        (underObject ? '"' : "") +
        object +
        (underObject ? '"' : "") +
        "</span>"
      );
    case "undefined":
      return "<span class='undefined'>undefined</span>";
    case "symbol":
      return valueAsHTML(object.toString());
    default:
      return object.toString();
  }
}

function determineTypedArray(object) {
  return (
    [
      { constructor: Int8Array, asString: "Int8Array" },
      { constructor: Int16Array, asString: "Int16Array" },
      { constructor: Int32Array, asString: "Int32Array" },
      { constructor: Uint8Array, asString: "Uint8Array" },
      { constructor: Uint8ClampedArray, asString: "Uint8ClampedArray" },
      { constructor: Uint16Array, asString: "Uint16Array" },
      { constructor: Uint32Array, asString: "Uint32Array" },
      { constructor: Float32Array, asString: "Float32Array" },
      { constructor: Float64Array, asString: "Float64Array" },
    ].find((value) => object instanceof value.constructor) || false
  );
}

function some(testObj, callBackFn) {
  if (Array.isArray(testObj)) {
    return testObj.some(callBackFn);
  }
  for (let key of Object.keys(testObj)) {
    if (callBackFn(testObj[key])) {
      return true;
    }
  }
  return false;
}
