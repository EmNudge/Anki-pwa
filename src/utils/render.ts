import katex from "katex";

type Variables = { [key: string]: string | null };

// security risk - figure out how to do this safely
// maybe embed in an iframe?
export function getRenderedCardString({
  templateString,
  variables,
  mediaFiles,
}: {
  templateString: string;
  variables: Variables;
  mediaFiles: Map<string, string>;
}) {
  let renderedString = templateString;

  renderedString = flattenOptionalSections(templateString, variables);

  renderedString = renderedString.replace(/\{\{(.*?)\}\}/g, (_match, p1) => {
    const field = variables[p1];
    return field ?? "";
  });

  renderedString = replaceTemplatingSyntax(renderedString);

  renderedString = replaceLatex(renderedString);

  renderedString = replaceMediaFiles(renderedString, mediaFiles);

  return renderedString;
}

/**
 * source strings are replaced with blob URLs
 */
function replaceMediaFiles(renderedString: string, mediaFiles: Map<string, string>) {
  return renderedString.replace(/="([^"]+?\.[^."]+)"/g, (match, filename) => {
    const url = mediaFiles.get(filename);
    return url ? `="${url}"` : match;
  });
}

function replaceLatex(renderedString: string) {
  const replaceLatex = (match: string, latex: string) => {
    try {
      return katex.renderToString(latex);
    } catch (error) {
      console.error(new Error("could not parse latex for: " + latex, { cause: error }));
      return match;
    }
  };

  return renderedString
    .replace(/\[\$\$?\](.+?)\[\/\$\$?\]/g, replaceLatex)
    .replace(/\[latex\](.+?)\[\/latex\]/g, replaceLatex);
}

function replaceTemplatingSyntax(renderedString: string) {
  return renderedString
    .replace(/\[sound:(.+?)\]/g, (_match, filename) => {
      return `<audio src="${filename}" controls />`;
    })
    .replace(/(\w+)\[(\w+)\]/g, (_match, rubyBase, rubyText) => {
      return `<ruby>${rubyBase}<rt>${rubyText}</rt></ruby>`;
    });
}

/**
 * Optional sections of the form {#section}content{{/section}} are flattened.
 * If card[section] is not present, the section is removed.
 * If it is present, the guards are removed and the content remains.
 */
function flattenOptionalSections(templateString: string, card: Variables) {
  let renderedString = templateString;

  const optionalSections = [
    ...new Set([...renderedString.matchAll(/\{\{#(.*?)\}\}/g)].map((match) => match[1])),
  ];

  if (optionalSections) {
    for (const section of optionalSections) {
      const regex = new RegExp(
        `\\{\\{\\#${section}\\}\\}((?:.|\n)+?)\\{\\{\\/${section}\\}\\}`,
        "g",
      );

      if (section && !card[section]) {
        renderedString = renderedString.replace(regex, "");
        continue;
      }

      renderedString = renderedString.replace(regex, "$1");
    }
  }

  return renderedString;
}
