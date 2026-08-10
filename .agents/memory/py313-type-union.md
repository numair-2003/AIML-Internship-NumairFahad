---
name: Python 3.13 type union syntax limitation
description: X | None in module-level variable annotations fails in Python 3.13 without __future__
---

## The problem
In Python 3.13, using `X | None` for **module-level variable annotations** raises:
```
TypeError: unsupported operand type(s) for |: 'function' and 'NoneType'
```

## The fix
Use `Optional[X]` from `typing` for module-level variable annotations:
```python
from typing import Optional
_client: Optional[SomeClass] = None  # ✓ works
_client: SomeClass | None = None    # ✗ fails at module level in Py 3.13
```

Note: `X | None` IS supported in function/method return type annotations in Python 3.10+. The restriction is specifically for module-level (and class-level) variable annotations.

**Why:** Python 3.13 evaluates module-level annotations eagerly unless `from __future__ import annotations` is used. The `|` operator isn't defined for type objects in that context.
