from pathlib import Path


SOURCE = Path(__file__).parents[1] / "data" / "word" / "2" / "1"

FILES = [
    ("014e769a993517e274ee1e2101ab6407.png", "conservative.png"),
    ("0d346ff7eb38659347b0a85f07b314c1.png", "associate.png"),
    ("0d394ce221dd062b0589457b92b8a902.png", "publish.png"),
    ("11f5f0e16453659fe137b3f6f624a4fc.png", "fair.png"),
    ("149f16934c95662543f0d82a1bd32dbe.png", "just.png"),
    ("171f0ee07dd08f9c10858ed57baf0577.png", "observe.png"),
    ("17cc4ba413d59979dc5dd1f0bedfa67f.png", "communicate.png"),
    ("1c1b737b0f206a1281fef5397daa5a85.png", "govern.png"),
    ("1c8a9530c2192b3fa1ef0dccd8331eb3.png", "wish.png"),
    ("1cfcde3fe092f15868e0a4b1fa21d33d.png", "law.png"),
    ("20f3f5daaa36536ea844550db550db12.png", "order.png"),
    ("2104dc9142ec8053abc324b5f2908417.png", "generate.png"),
    ("385a75f1c679d85f8f2f8a39f5b2f048.png", "norm.png"),
    ("4707470b9b818015dc8156f45c13c388.png", "suppose.png"),
    ("47bc7033e2d54a73fe5e2696321ce52f.jpg", "distant.jpg"),
    ("4a238b2f13dff482762c1beb820aabff.png", "private.png"),
    ("4d63aabf2dd2e2ddd614436161b75073.png", "politics.png"),
    ("54a3cf9df061f03b4a94dc0775ac3f93.png", "legal.png"),
    ("64e64c128f48a8e5e935166d91eb857a.jpg", "bias.jpg"),
    ("67c80b0aca7873f3b17fb00f14128959.jpg", "adjust.jpg"),
    ("72a1d8c5f88ba36eb4f2e6c18346b649.png", "enjoy.png"),
    ("73dff786985cf9301510826e3ed5252a.png", "common.png"),
    ("769113bc323b61612f76bd162b989711.png", "custom.png"),
    ("7c8bcff4706eb49f9c10ca459a077334.png", "regulate.png"),
    ("8a2c5ccaf006b4ab77c764460e5cd6f9.png", "temple.png"),
    ("8b3acc68a0285d49df5632f1cd0803ef.jpg", "memorable.jpg"),
    ("8c1bfbddac4b2503a959144f76b57036.jpg", "curious.jpg"),
    ("91e455772b5454445471abe8900c51d9.png", "community.png"),
    ("947acecba79c5bbcc61d45c694538053.png", "vivid.png"),
    ("959ba14d254726b495b6e6d6c64885c8.png", "dominate.png"),
    ("9861cf3478af1d020f51fe23601a9102.png", "judge.png"),
    ("9bc7037b13027d3dea2a8952a3dd7f03.png", "provide.png"),
    ("b37dac79bb261bf1fba75ed645c324ef.jpg", "consume.jpg"),
    ("b6e13a3b0524bbbffd1e918ba6b0a604.png", "serve.png"),
    ("b95cce5173bbfed7edc0e1fc0042204e.jpg", "appreciate.jpg"),
    ("cba0730ffe021804a3ba64d7ce1003f1.png", "public.png"),
    ("dd8dae9c05e8f98d36bf75f9a9bca51e.png", "policy.png"),
    ("ec5d87e4063ebd2bfeaa58d9aceb5f68.png", "popular.png"),
    ("ed0b68c78602bad0fe984453a856b078.png", "social.png"),
]


renamed = 0
for source_name, target_name in FILES:
    source = SOURCE / source_name
    target = SOURCE / target_name
    if target.exists():
        continue
    if not source.exists():
        raise FileNotFoundError(source)
    source.rename(target)
    renamed += 1

print(f"ready: {len(FILES)} images, renamed now: {renamed}")
