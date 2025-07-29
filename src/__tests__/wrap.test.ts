/* eslint-disable @typescript-eslint/ban-ts-comment */
import { appendProofToDocuments, merkleHashmap } from "../implementations/wrap";
import { Output } from "../implementations/utils/disk";
import * as disk from "../implementations/utils/disk";
import fs from "fs";
import util from "util";
import { utils } from "@tradetrust-tt/tradetrust";

describe("batchIssue", () => {
  describe("appendProofToDocuments", () => {
    it("determines the proof for each document using the hashmap and writes the new document back", async () => {
      const hashMap = {
        a: { sibling: "b", parent: "d" },
        b: { sibling: "a", parent: "d" },
        c: { sibling: "d", parent: "e" },
        d: { sibling: "c", parent: "e" },
      };

      // Mock fs.lstatSync to always return a directory
      jest.spyOn(fs, "lstatSync").mockImplementation((): any => {
        console.log("🚀 ~ isDirectory:");
        return {
          isDirectory: (): boolean => {
            console.log("🚀 ~ isDirectory:");
            return true;
          },
        };
      });

      // Mock readdirSync for synchronous calls
      jest.spyOn(fs, "readdirSync").mockImplementation((): any => {
        console.log("🚀 ~ fs ~ readdirSync:");
        return ["file_1.json", "file_2.json", "file_3.json"];
      });

      // Create a mock implementation that will be used by the promisified version
      const mockReaddirImpl = jest.fn().mockImplementation((path: any, options: any, callback: any) => {
        console.log("🚀 ~ DIRECT fs.readdir called with path:", path);

        // Handle both callback style and promisified style
        if (typeof options === "function") {
          callback = options;
          options = undefined;
        }

        if (callback) {
          // Ensure callback is called asynchronously to better simulate real behavior
          process.nextTick(() => {
            callback(null, ["file_1.json", "file_2.json", "file_3.json"]);
          });
        }
        return undefined;
      });

      // Replace the fs.readdir implementation
      jest.spyOn(fs, "readdir").mockImplementation(mockReaddirImpl);

      // Mock promisify to return our custom implementation for fs.readdir
      jest.spyOn(util, "promisify").mockImplementation((fn) => {
        console.log("🚀 ~ promisify:");
        if (fn === fs.readdir) {
          console.log("🚀 ~ promisifying fs.readdir");
          return jest.fn().mockResolvedValue(["file_1.json", "file_2.json", "file_3.json"]);
        }
        // Fall back to original for other functions
        // @ts-ignore
        return jest.requireActual("util").promisify(fn);
      });

      // // Ensure documentsInDirectory gets mocked directly to bypass any fs issues
      jest
        .spyOn(disk, "documentsInDirectory")
        .mockResolvedValue(["DIR/file_1.json", "DIR/file_2.json", "DIR/file_3.json"]);

      jest.spyOn(fs, "readFileSync").mockImplementation((path) => {
        console.log("🚀 ~ readFileSync:", path);
        // @ts-ignore
        if (path.includes("file_1.json")) {
          return JSON.stringify({
            signature: {
              targetHash: "a",
            },
          });
        }
        // @ts-ignore
        else if (path.includes("file_2.json")) {
          return JSON.stringify({
            signature: {
              targetHash: "b",
            },
          });
        }
        // @ts-ignore
        else if (path.includes("file_3.json")) {
          return JSON.stringify({
            signature: {
              targetHash: "c",
            },
          });
        }
        return "";
      });
      jest.spyOn(fs, "writeFileSync").mockImplementation((path, document) => {
        if (typeof path !== "string") throw new Error("path is not string");
        if (path.includes("file_1.json")) {
          // sorry lint I did my best to avoid that
          // eslint-disable-next-line jest/no-conditional-expect
          expect(document).toStrictEqual(
            JSON.stringify(
              {
                signature: {
                  targetHash: "a",
                  proof: ["b", "c"],
                  merkleRoot: "e",
                },
              },
              null,
              2
            )
          );
          return;
        }
        // @ts-ignore
        else if (path.includes("file_2.json")) {
          // sorry lint I did my best to avoid that
          // eslint-disable-next-line jest/no-conditional-expect
          expect(document).toStrictEqual(
            JSON.stringify(
              {
                signature: {
                  targetHash: "b",
                  proof: ["a", "c"],
                  merkleRoot: "e",
                },
              },
              null,
              2
            )
          );
          return;
        }
        // @ts-ignore
        else if (path.includes("file_3.json")) {
          // sorry lint I did my best to avoid that
          // eslint-disable-next-line jest/no-conditional-expect
          expect(document).toStrictEqual(
            JSON.stringify(
              {
                signature: {
                  targetHash: "c",
                  proof: ["d"],
                  merkleRoot: "e",
                },
              },
              null,
              2
            )
          );
          return;
        }
        throw new Error(`unhandled ${path} in spy`);
      });

      const root = await appendProofToDocuments({
        intermediateDir: "DIR",
        hashMap,
        outputPathType: Output.Directory,
        digestedDocumentPath: "DIR",
      });

      expect(root).toBe("e");
    });
  });

  const h1 = "41b1a0649752af1b28b3dc29a1556eee781e4a4c3a1f7f53f90fa834de098c4d";
  const h2 = "435cd288e3694b535549c3af56ad805c149f92961bf84a1c647f7d86fc2431b4";
  const h12 = "744766909640c85c19ca00139e7af3c5d9cb8dbfbc6635812eedc4e3cbf4fce6";

  describe("merkleHashmap", () => {
    it("returns empty object for one hash (root)", () => {
      const hmap = merkleHashmap([utils.hashToBuffer(h1)]);
      expect(hmap).toStrictEqual({});
    });
    it("returns hashmap for two hashes", () => {
      const hmap = merkleHashmap([utils.hashToBuffer(h1), utils.hashToBuffer(h2)]);
      expect(hmap).toStrictEqual({
        [h1]: { sibling: h2, parent: h12 },
        [h2]: { sibling: h1, parent: h12 },
      });
    });
    it("returns hashmap for odd number (5) hashes", () => {
      const hashArray = [
        "3ac225168df54212a25c1c01fd35bebfea408fdac2e31ddd6f80a4bbf9a5f1cb",
        "b5553de315e0edf504d9150af82dafa5c4667fa618ed0a6f19c69b41166c5510",
        "0b42b6393c1f53060fe3ddbfcd7aadcca894465a5a438f69c87d790b2299b9b2",
        "f1918e8562236eb17adc8502332f4c9c82bc14e19bfc0aa10ab674ff75b3d2f3",
        "a8982c89d80987fb9a510e25981ee9170206be21af3c8e0eb312ef1d3382e761",
      ];
      const hashArrayBuf = hashArray.map(utils.hashToBuffer);
      const hmap = merkleHashmap(hashArrayBuf);
      const expectedHmap = {
        "3ac225168df54212a25c1c01fd35bebfea408fdac2e31ddd6f80a4bbf9a5f1cb": {
          sibling: "b5553de315e0edf504d9150af82dafa5c4667fa618ed0a6f19c69b41166c5510",
          parent: "805b21d846b189efaeb0377d6bb0d201b3872a363e607c25088f025b0c6ae1f8",
        },
        b5553de315e0edf504d9150af82dafa5c4667fa618ed0a6f19c69b41166c5510: {
          sibling: "3ac225168df54212a25c1c01fd35bebfea408fdac2e31ddd6f80a4bbf9a5f1cb",
          parent: "805b21d846b189efaeb0377d6bb0d201b3872a363e607c25088f025b0c6ae1f8",
        },
        "0b42b6393c1f53060fe3ddbfcd7aadcca894465a5a438f69c87d790b2299b9b2": {
          sibling: "f1918e8562236eb17adc8502332f4c9c82bc14e19bfc0aa10ab674ff75b3d2f3",
          parent: "d253a52d4cb00de2895e85f2529e2976e6aaaa5c18106b68ab66813e14415669",
        },
        f1918e8562236eb17adc8502332f4c9c82bc14e19bfc0aa10ab674ff75b3d2f3: {
          sibling: "0b42b6393c1f53060fe3ddbfcd7aadcca894465a5a438f69c87d790b2299b9b2",
          parent: "d253a52d4cb00de2895e85f2529e2976e6aaaa5c18106b68ab66813e14415669",
        },
        "805b21d846b189efaeb0377d6bb0d201b3872a363e607c25088f025b0c6ae1f8": {
          sibling: "d253a52d4cb00de2895e85f2529e2976e6aaaa5c18106b68ab66813e14415669",
          parent: "68203f90e9d07dc5859259d7536e87a6ba9d345f2552b5b9de2999ddce9ce1bf",
        },
        d253a52d4cb00de2895e85f2529e2976e6aaaa5c18106b68ab66813e14415669: {
          sibling: "805b21d846b189efaeb0377d6bb0d201b3872a363e607c25088f025b0c6ae1f8",
          parent: "68203f90e9d07dc5859259d7536e87a6ba9d345f2552b5b9de2999ddce9ce1bf",
        },
        "68203f90e9d07dc5859259d7536e87a6ba9d345f2552b5b9de2999ddce9ce1bf": {
          sibling: "a8982c89d80987fb9a510e25981ee9170206be21af3c8e0eb312ef1d3382e761",
          parent: "1dd0d2a6ae466d665cb26e1a31f07c57ae5df7d2bc559cd5826d417be9141a5d",
        },
        a8982c89d80987fb9a510e25981ee9170206be21af3c8e0eb312ef1d3382e761: {
          sibling: "68203f90e9d07dc5859259d7536e87a6ba9d345f2552b5b9de2999ddce9ce1bf",
          parent: "1dd0d2a6ae466d665cb26e1a31f07c57ae5df7d2bc559cd5826d417be9141a5d",
        },
      };

      expect(hmap).toStrictEqual(expectedHmap);
    });
  });
});
