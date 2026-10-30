import re
from pathlib import Path
p = Path(r"c:\xampp\htdocs\DeepTrace_SPHINX-26\DeepTrace\backend\training\train.py")
s = p.read_text(encoding="utf-8")

old_collate = '''    def collate_fn(batch):
        return {
            "pixel_values": torch.stack([x["pixel_values"] for x in batch]),
            "labels": torch.tensor([x["label"] for x in batch]),
        }'''
new_collate = '''    def collate_fn(batch):
        # ImageFolder: fake=0, real=1; intended: REAL=0, FAKE=1
        labels = torch.tensor([1 - x["label"] for x in batch])
        return {
            "pixel_values": torch.stack([x["pixel_values"] for x in batch]),
            "labels": labels,
        }'''
assert old_collate in s, "collate_fn block not found"
s = s.replace(old_collate, new_collate)

s = s.replace('evaluation_strategy="epoch" if val_data else "no"', 'eval_strategy="epoch" if val_data else "no"')

p.write_text(s, encoding="utf-8")
print("train.py patched")
PYEOF
print("ok")
