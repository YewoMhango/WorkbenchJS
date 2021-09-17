let workbench = {
  textarea: document.querySelector("#input"),
  output: document.querySelector("#output"),
  runButton: document.querySelector("#run"),
  clearButton: document.querySelector("#clear"),
  replaceSelection(field, word, spaceToLeaveAtFromEnd = 0) {
    let from = field.selectionStart,
    to = field.selectionEnd;
    field.value =
    field.value.slice(0, from) + word + field.value.slice(to);
    // Put the cursor after the word
    field.selectionStart = from + word.length - spaceToLeaveAtFromEnd;
    field.selectionEnd = from + word.length - spaceToLeaveAtFromEnd;
  },
  run() {
    let input = workbench.textarea.value;
    input = input.replace(/console.log/g, "workbench.print");
    try {
      let code = Function("", input);
      let result = code();
      workbench.print("");
    } catch (e) {
      workbench.print(e);
    }
  },
  print() {
    let paragraph = document.createElement("div");
    for (let argument of arguments) {
      paragraph.innerHTML += workbench.valueAsHTML(argument) + " ";
    }
    workbench.output.append(paragraph);
  },
  clearOutput() {
    workbench.output.innerText = "";
  },
  valueAsHTML(object, tabspace = "\n", underObject = false) {
    let string;
    switch (typeof object) {
      case "object":
        if (object === null) {
          string = "<span class='null'>null</span>";
        } else if (
          Object.getPrototypeOf(object) == Object.getPrototypeOf(/./)
        ) {
          string = "<span class='RegExp'>" + object + "</span>";
        } else if (
          Object.getPrototypeOf(object)
          .toString()
          .includes("Error")
        ) {
          string = "<span class='error'>" + object + "</span>";
        } else {
          let isArray = Array.isArray(object);
          string = isArray ? "[": "{";
          let spacer;

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

          if (
            !some(object, element => {
              return typeof element == "object";
            })
          )
          spacer = " ";
          else spacer = tabspace + "  ";

          for (let key of Object.keys(object)) {
            if (isArray) {
              if (typeof object[key] == "object") {
                string +=
                spacer +
                workbench.valueAsHTML(
                  object[key],
                  tabspace + "  ",
                  true
                ) +
                ",";
              } else {
                string +=
                spacer +
                workbench.valueAsHTML(object[key], undefined, true) +
                ",";
              }
            } else if (typeof object[key] == "object") {
              string +=
              spacer +
              key +
              ": " +
              workbench.valueAsHTML(
                object[key],
                tabspace + "  ",
                true
              ) +
              ",";
            } else {
              (string +=
                spacer +
                key +
                ": " +
                workbench.valueAsHTML(object[key]) +
                ","),
              undefined,
              true;
            }
          }
          if (string[string.length - 1] == ",") {
            string = string.slice(0, string.length - 1);
          }

          string +=
          (spacer == " " ? spacer: tabspace) + (isArray ? "]": "}");
        }
        break;
      case "number":
        case "boolean":
          string = "<span class='numberOrBoolean'>" + object + "</span>";
          break;
        case "string":
          string =
          "<span class='string'>" +
          (underObject ? "'": "") +
          object +
          (underObject ? "'": "") +
          "</span>";
          break;
        case "undefined":
          string = "<span class='undefined'>undefined</span>";
          break;
    }
    return string;
  }
};
workbench.runButton.onclick = workbench.run;
workbench.clearButton.onclick = workbench.clearOutput;
workbench.textarea.addEventListener("keydown", event => {
  switch (event.key) {
    case "Tab":
      event.preventDefault();
      workbench.replaceSelection(workbench.textarea, "  ");
      break;
    case "(":
      workbench.replaceSelection(workbench.textarea, ")", 1);
      break;
    case "{":
      workbench.replaceSelection(workbench.textarea, "}", 1);
      break;
    case "[":
      workbench.replaceSelection(workbench.textarea, "]", 1);
      break;
  }
});
document.addEventListener("keydown", event => {
  if (event.ctrlKey && event.key == "Enter") {
    event.preventDefault();
    workbench.run();
  }
});