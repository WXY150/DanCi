from pathlib import Path

SOURCE = Path(__file__).parents[1] / "data" / "word" / "1" / "1"

FILES = [
    ("03e5be19110f9505c696b0956ff103b0.jpg", "upend.jpg"),
    ("0621bf3e8f4352f20e78332854a52050.jpg", "organ.jpg"),
    ("110c91fd1283a8618c7a683184ab47f6.jpg", "ecology.jpg"),
    ("11b8a2ae9bdfe3acf95467ffca0e3b71.jpg", "express.jpg"),
    ("1288c7b61e496e7bf65746fb693f5b38.jpg", "manage.jpg"),
    ("14db324d2cdb757550a808b27b6e5c0f.png", "underlie.png"),
    ("1578ca70a95b33ffe5f02ba1d49801e7.jpg", "outset.jpg"),
    ("18a408f014724ad5f9cb4047d9d1153e.jpg", "determined.jpg"),
    ("1b3aeb518115ccdfc4d7a48f0e8f2cd5.jpg", "remain.jpg"),
    ("217cb9e66bcce2782b819716e150435d.jpg", "program.jpg"),
    ("23ff74ee6bba1bdc93659623e120f114.jpg", "undercut.jpg"),
    ("279c12df8d4f3f2a8a0b618e45afff7e.jpg", "achieve.jpg"),
    ("2e70a295b716b5820bcb874cbb23fec8.jpg", "oversee.jpg"),
    ("346ad045ae9c431895d18fa71b82a914.jpg", "century.jpg"),
    ("3a89f5f694ca0a0e365401799b4d64db.jpg", "decline.jpg"),
    ("3abd16c265627b3bb69c528b4f999477.jpg", "divide.jpg"),
    ("3d3f2632b1180db4b5b7c47d11c395a9.jpg", "undergo.jpg"),
    ("40f6e6eb5330f3653e204254d9bab7aa.jpg", "during.jpg"),
    ("4883811409e605c31f54de1ec87005c0.jpg", "overwhelm.jpg"),
    ("551a468a0be54ed2c1377c31d7ef0650.jpg", "similar.jpg"),
    ("563ec72629715d6bb0409fc683df61c5.jpg", "up.jpg"),
    ("57f6a47dac4163da9c4c1a9fd58c83ee.jpg", "intellect.jpg"),
    ("5a230946402b6911a16a7c08b555bf5c.jpg", "upheaval.jpg"),
    ("648554a67f74052d09ee8a2f59c2eb5f.jpg", "overlook.jpg"),
    ("6702e25a69b515a16934d34232e7de69.jpg", "determine.jpg"),
    ("6791b44909f28c563c3e60272845cb8e.jpg", "overhaul.jpg"),
    ("68d7e44ad475fd323d40792d5c5ae4b8.jpg", "decade.jpg"),
    ("6ce4df310db596f2ff45d396d5bf3aa7.jpg", "overarching.jpg"),
    ("6dcef65b19bf9fd9c8e497de223baa5b.png", "outrage.png"),
    ("6f276daa0e258b88419754da42c05a75.jpg", "out.jpg"),
    ("7106242e3a1dda5440ef0f9481548d5b.jpg", "update.jpg"),
    ("711b713b997bd183a62cebe367d76f7a.jpg", "overturn.jpg"),
    ("76aaaba85028e9d12994fcc818d66b7c.jpg", "try.jpg"),
    ("78ae591bf77fe66c90b7f7db9595f741.jpg", "concern.jpg"),
    ("7a939128b064dce2cec977010a7673a2.jpg", "outbreak.jpg"),
    ("7e386e1e66cd7e0a93f6f006af760543.jpg", "overcome.jpg"),
    ("8a5615c41774bbec641e77fc0113a287.jpg", "uphold.jpg"),
    ("8a66dd650248736a298fe0669bf5277d.jpg", "schedule.jpg"),
    ("940ba5e3ccc652f2459045a376781a7d.jpg", "leave.jpg"),
    ("964b6563d3f79b8acf52a59a5db9966c.jpg", "literate.jpg"),
    ("97db2f8945c7c78c7a2606aa736d36b7.jpg", "part.jpg"),
    ("9a32e872c5d5b40f5db55d058c243495.jpg", "paragraph.jpg"),
    ("9d2662ce804cc3b956c5da362f001a85.jpg", "screen.jpg"),
    ("a12fc2bf561fb2db8ca25cddfa60334f.jpg", "probable.jpg"),
    ("a19d6b081bc39e595555af6ed604b70e.jpg", "emerge.jpg"),
    ("a6103a1bd8ea238bb7184deef5a77703.jpg", "outline.jpg"),
    ("a7d1897e1d3f98f9483988959b9922b4.jpg", "trouble.jpg"),
    ("a8e9b2d1ad5be0659135649fa32555bc.jpg", "upholstered.jpg"),
    ("a9c72377a6c646a1a780212134519f67.jpg", "body.jpg"),
    ("b3222b024fb4725782a5370fb0ffb8ed.jpg", "undercover.jpg"),
    ("b3d3b04ba05eb7c32a0cf6a852461075.jpg", "earnings.jpg"),
    ("b5a7d39f2d553bed015617705be53c03.jpg", "overshadow.jpg"),
    ("bb98c5d50b664cdd97eeb135809b987f.jpg", "underlie.jpg"),
    ("c0317204925755438e4b024fbba0b0c2.jpg", "outcome.jpg"),
    ("c054ce7ce775f5846acc5db3fc564093.jpg", "decide.jpg"),
    ("c24b4a9f7b2b918f95b1b8e5182bf6c8.jpg", "outlet.jpg"),
    ("c65438e1aa82f093dc24811eb04b9548.jpg", "limit.jpg"),
    ("c89a249d1a5fb1072d3bbd4b1b26056a.jpg", "word.jpg"),
    ("c946cf7cfbdb81bd0671d3e9808b48a9.jpg", "hand.jpg"),
    ("cb5007bfe48e47ed5e1dd08edb1091ae.jpg", "head.jpg"),
    ("cb9140a0d44ba0ecdaa8a327dd21b38f.jpg", "overrule.jpg"),
    ("cca3956be986a660e852d9d6c3202da2.jpg", "output.jpg"),
    ("d106a9ff9a89d9d0dc2263e4e4fce20b.jpg", "describe.jpg"),
    ("d37f1913d4fa397226d3d6aef7b4b633.jpg", "author.jpg"),
    ("d557b17dcadf13eb42bb127b3fe81ae4.jpg", "over.jpg"),
    ("d5ad02cb18627ba277e06dc637afe112.jpg", "particular.jpg"),
    ("da14542cd8cc9cb37f9b9d26216977b5.jpg", "wage.jpg"),
    ("dd93036f79dc631756868844d65a53c5.jpg", "salary.jpg"),
    ("e11db3dd881f914892f34e1d759e0f7e.jpg", "level.jpg"),
    ("e47d501699964519d23ae8fb7e554e59.jpg", "depart.jpg"),
    ("e7b3f235dc6fc58267eb9a24c582cc0a.jpg", "income.jpg"),
    ("e97221ab54b6dbb3ae64c68b3c3d603c.jpg", "out-2.jpg"),
    ("eaa0af70ad64846907d8000319b6ccb0.jpg", "fair.jpg"),
    ("ebc47eb1deb068cccfd981e0932cb39c.jpg", "under.jpg"),
    ("ece4d02245fd0cd533e87cb5f7571704.jpg", "hundred.jpg"),
    ("eee74fe8939a7a6d69d117beb1761072.jpg", "analyze.jpg"),
    ("f0a682e11a553f831519f58937d4f664.jpg", "assume.jpg"),
    ("f621c9ff0b94a14a6cafa06ca1904b1f.jpg", "upset.jpg"),
]

renamed = 0
for source_name, target_name in FILES:
    source = SOURCE / source_name
    target = SOURCE / target_name
    if source.exists():
        if target.exists():
            raise FileExistsError(f"target already exists: {target_name}")
        source.rename(target)
        renamed += 1
    elif not target.exists():
        raise FileNotFoundError(f"missing source and output: {source_name} -> {target_name}")

print(f"ready: {len(FILES)} images, renamed now: {renamed}")
