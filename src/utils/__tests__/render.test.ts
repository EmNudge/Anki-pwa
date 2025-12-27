import { describe, it, expect } from "vitest";
import { getRenderedCardString } from "../render";

describe("getRenderedCardString", () => {
  it("should correctly render Template 1 from German deck", () => {
    const variables = {
      Front: "haben",
      Back: "to have",
      Formen: "",
      Audio: "[sound:test.mp3]",
      Comments: "",
    };

    // Template 1 - Front: German word
    const template1Front = `{{Front}}
{{Audio}}`;

    const frontHtml = getRenderedCardString({
      templateString: template1Front,
      variables,
      mediaFiles: new Map(),
    });

    console.log("Template 1 Front:", frontHtml);

    // Template 1 - Back: Front + English translation
    const template1Back = `{{FrontSide}}

<hr id=answer>

{{Formen}}</br>
{{Back}}
</br>
</br>
<div class="font-size20">{{Comments}}</div>`;

    const backHtml = getRenderedCardString({
      templateString: template1Back,
      variables: { ...variables, FrontSide: frontHtml },
      mediaFiles: new Map(),
    });

    console.log("Template 1 Back:", backHtml);

    // The front should show the German word and audio
    expect(frontHtml).toContain("haben");
    expect(frontHtml).toContain("<audio");

    // The back should show BOTH the German (via FrontSide) AND the English
    expect(backHtml).toContain("haben"); // from FrontSide
    expect(backHtml).toContain("to have"); // from Back field
    expect(backHtml).toContain("<audio");
    expect(backHtml).toContain("<hr");

    // Verify the back is NOT just showing the front
    expect(backHtml).not.toBe(frontHtml);
    expect(backHtml.length).toBeGreaterThan(frontHtml.length);
  });

  it("should correctly render Template 2 from German deck", () => {
    const variables = {
      Front: "haben",
      Back: "to have",
      Formen: "",
      Audio: "[sound:test.mp3]",
    };

    // Template 2 - Front: English word
    const template2Front = "{{Back}}";
    const frontHtml = getRenderedCardString({
      templateString: template2Front,
      variables,
      mediaFiles: new Map(),
    });

    console.log("Template 2 Front:", frontHtml);
    expect(frontHtml).toBe("to have");

    // Template 2 - Back: English + German with audio
    const template2Back = `{{FrontSide}}

<hr id=answer>

{{Front}}
{{Audio}} </br>
{{Formen}}`;

    const backHtml = getRenderedCardString({
      templateString: template2Back,
      variables: { ...variables, FrontSide: frontHtml },
      mediaFiles: new Map(),
    });

    console.log("Template 2 Back:", backHtml);

    // The back should contain both the front side AND the additional content
    expect(backHtml).toContain("to have"); // from FrontSide
    expect(backHtml).toContain("haben"); // from Front field
    expect(backHtml).toContain("<audio");

    // Verify the back is NOT just showing the front
    expect(backHtml).not.toBe(frontHtml);
    expect(backHtml.length).toBeGreaterThan(frontHtml.length);
  });

  it("should handle field names with special characters", () => {
    const variables = {
      "Field-Name": "value1",
      "Field_Name": "value2",
    };

    const template = "{{Field-Name}} and {{Field_Name}}";
    const html = getRenderedCardString({
      templateString: template,
      variables,
      mediaFiles: new Map(),
    });

    expect(html).toBe("value1 and value2");
  });

  it("should handle FrontSide that contains HTML", () => {
    const variables = {
      Front: "test<br>content",
      Back: "answer",
    };

    const frontHtml = getRenderedCardString({
      templateString: "{{Front}}",
      variables,
      mediaFiles: new Map(),
    });

    const backHtml = getRenderedCardString({
      templateString: "{{FrontSide}}\n<hr>\n{{Back}}",
      variables: { ...variables, FrontSide: frontHtml },
      mediaFiles: new Map(),
    });

    expect(backHtml).toContain("test<br>content");
    expect(backHtml).toContain("answer");
  });

  it("should handle FrontSide containing template-like syntax", () => {
    // Test case where FrontSide value might contain {{...}}
    const variables = {
      Front: "test {{notAField}}",
      Back: "answer",
    };

    const frontHtml = getRenderedCardString({
      templateString: "{{Front}}",
      variables,
      mediaFiles: new Map(),
    });

    console.log("Front with template-like syntax:", frontHtml);

    const backHtml = getRenderedCardString({
      templateString: "{{FrontSide}}\n<hr>\n{{Back}}",
      variables: { ...variables, FrontSide: frontHtml },
      mediaFiles: new Map(),
    });

    console.log("Back with FrontSide containing template-like syntax:", backHtml);

    // The {{notAField}} is in the FIELD VALUE, not the template, so it stays as-is
    expect(frontHtml).toBe("test {{notAField}}");
    // The back should contain the front content AND the back content
    expect(backHtml).toContain("test {{notAField}}");
    expect(backHtml).toContain("answer");
  });

  it("should properly close audio tags to prevent nesting issues", () => {
    // Regression test for bug where self-closing <audio /> caused subsequent HTML to be nested inside
    const variables = {
      Front: "Hallo",
      Back: "Hello",
      Audio: "[sound:test.mp3]",
    };

    const frontTemplate = `{{Front}}
{{Audio}}`;

    const frontHtml = getRenderedCardString({
      templateString: frontTemplate,
      variables,
      mediaFiles: new Map(),
    });

    const backTemplate = `{{FrontSide}}

<hr id=answer>

{{Back}}`;

    const backHtml = getRenderedCardString({
      templateString: backTemplate,
      variables: { ...variables, FrontSide: frontHtml },
      mediaFiles: new Map(),
    });

    // Audio tag should NOT be self-closing (which would cause browsers to treat it as an opening tag)
    expect(frontHtml).toContain("</audio>");
    expect(frontHtml).not.toMatch(/<audio[^>]*\/>/);

    // The back should contain the front AND the translation (not nested inside audio tag)
    expect(backHtml).toContain("Hallo");
    expect(backHtml).toContain("Hello");
    expect(backHtml).toContain("<hr");

    // Verify audio tag is properly closed in the back as well
    expect(backHtml).toContain("</audio>");
    expect(backHtml).not.toMatch(/<audio[^>]*\/>/);
  });
});
