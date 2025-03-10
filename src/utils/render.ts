// security risk - figure out how to do this safely
// maybe embed in an iframe?
export function getRenderedCardString(
  { templateString, variables, mediaFiles }: {
    templateString: string;
    variables: { [key: string]: string };
    mediaFiles: Map<string, string>;
  },
) {
  let renderedString = templateString;
  
  renderedString = flattenOptionalSections(templateString, variables);
  
  renderedString = renderedString.replace(/\{\{(.*?)\}\}/g, (_match, p1) => {
    const field = variables[p1];
    return field ?? '';
  });

  renderedString = replaceMediaFiles(renderedString, mediaFiles);

  return renderedString;
}

/**
 * source strings are replaced with blob URLs
 */
function replaceMediaFiles(renderedString: string, mediaFiles: Map<string, string>) {
  return renderedString.replace(/="([^"]+?\.[^\."]+)"/g, (match, filename) => {
    const url = mediaFiles.get(filename);
    return url ? `="${url}"` : match;
  });
}

/**
 * Optional sections of the form {#section}content{{/section}} are flattened.
 * If card[section] is not present, the section is removed.
 * If it is present, the guards are removed and the content remains.
 */
function flattenOptionalSections(templateString: string, card: { [key: string]: string }) {
  let renderedString = templateString;

  const optionalSections = [
    ...new Set(
      [...renderedString.matchAll(/\{\{\#(.*?)\}\}/g)].map((match) => match[1]),
    ),
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
