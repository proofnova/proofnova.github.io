# Source and license notices

PactWeave's engine, interfaces and product documentation are independently authored for ProofNova. Standard algorithm concepts are not claimed as inventions. No separately named external orchestration or context-database implementation is bundled as a required dependency.

## First-party ProofNova task adapters

The bundled adapters reuse the existing ProofNova task resources. Reuse is intentional; these algorithms are not claimed as newly invented by PactWeave. [vendor/source-lock.json](vendor/source-lock.json) records all 30 adapter source repositories, exact commits, file hashes and declared MIT licenses. [vendor/inventory.mjs](vendor/inventory.mjs) provides runtime metadata. Each vendor/<adapter-id>/LICENSE retains its original permission notice. Preserve each adapter's existing source notice.

The reused source uses this notice:

```text
MIT License

Copyright (c) 2026 Proofnova

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Architecture artwork and fonts

The project illustration is edited from the architecture attachment supplied by the user, under the user's direction. The public version replaces other product names with PactLoop, WeaveMesh and PactVault and documents actual support boundaries. The original attachment is not redistributed here. The repository records the image-edit provenance in its architecture assets. This notice does not make a legal claim about independently supplied original material.

The site uses system fonts and CSS shapes. It does not download or bundle a commercial font, icon pack or stock illustration library.

## Optional integrations

Host-installed runtimes, provider clients and explicitly configured external adapters remain separate optional software with their own licenses and service terms. Their presence must not be inferred from a capability label. Review an integration's actual code and license before shipping it; no blanket MIT authorization for external projects is assumed.

