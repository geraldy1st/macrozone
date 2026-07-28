import { base64ToUint8Array } from "@/utils/base64";

describe("base64ToUint8Array", () => {
  it("decodes plain base64", () => {
    // "hi" in base64
    const bytes = base64ToUint8Array("aGk=");
    expect(Array.from(bytes)).toEqual([104, 105]);
  });

  it("strips data-url prefix", () => {
    const bytes = base64ToUint8Array("data:image/jpeg;base64,aGk=");
    expect(Array.from(bytes)).toEqual([104, 105]);
  });
});
