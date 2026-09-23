# Source license header

New SKÄRMRO source files should carry an SPDX header near the top of the file.

For C# and JavaScript:

```text
// Copyright (C) 2026 Jimmy Eliasson
// SPDX-License-Identifier: GPL-3.0-only
```

For PowerShell:

```text
# Copyright (C) 2026 Jimmy Eliasson
# SPDX-License-Identifier: GPL-3.0-only
```

The repository-level LICENSE file controls the license even where an older source file does not yet contain an SPDX header. Existing source headers can be migrated incrementally without changing runtime behavior.
