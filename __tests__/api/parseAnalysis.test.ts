import { parseAnalysis } from "../../api/lib/parseAnalysis";

describe("parseAnalysis", () => {
  it("parses valid JSON", () => {
    const result = parseAnalysis(
      '{"name":"Salade","calories":320,"protein":12,"carbs":18,"fat":9}',
    );

    expect(result).toEqual({
      name: "Salade",
      calories: 320,
      protein: 12,
      carbs: 18,
      fat: 9,
    });
  });

  it("strips markdown fences", () => {
    const result = parseAnalysis(
      '```json\n{"name":"Pâtes","calories":450,"protein":15,"carbs":60,"fat":12}\n```',
    );

    expect(result.name).toBe("Pâtes");
    expect(result.calories).toBe(450);
  });

  it("clamps macro values to safe bounds", () => {
    const result = parseAnalysis(
      '{"name":"Burger","calories":99999,"protein":5000,"carbs":-10,"fat":12.6}',
    );

    expect(result.calories).toBe(10000);
    expect(result.protein).toBe(1000);
    expect(result.carbs).toBe(0);
    expect(result.fat).toBe(13);
  });

  it("throws when meal name is missing", () => {
    expect(() => parseAnalysis('{"calories":100}')).toThrow(
      "Invalid meal name in AI response",
    );
  });
});