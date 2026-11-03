// Les 5, stap 1: een knop die reageert als je eroverheen beweegt.
// Dit bestand staat op zichzelf: de hele poster tot en met deze stap zit erin.

class Les5Stap1 extends Phaser.Scene {
  constructor() {
    super("les5-stap1");
  }

  preload() {
    this.load.image("zon", "assets/zon.png");
    this.load.image("batterij-mannetje", "assets/batterij-man.png");
    this.load.image("batterij-extra", "assets/batterij-extra.png");
    this.load.image("heuvel-achter", "assets/heuvel-achter.png");
    this.load.image("heuvel-midden", "assets/heuvel-midden.png");
    this.load.image("heuvel-voor", "assets/heuvel-voor.png");
    this.load.image("confetti", "assets/confetti.png");
    this.load.image("regen", "assets/regen.png");
    this.load.image("bliksem", "assets/bliksem.png");
  }

  create() {
    this.maakLucht();
    this.maakZon();
    this.maakWolken();
    this.maakSter();
    this.maakHeuvels();
    this.maakFiguur();
    this.maakTitel();
    this.maakInfo();
    this.maakTimeline();
    this.zetDiepte();
    this.maakConfetti();
    this.maakCameraBeweging();
    // ★ Nieuw in deze stap
    this.maakKnop();
    this.maakRegen();
    this.maakBliksem();
    this.maakDagNacht();
  }

  update(time, delta) {
    for (const laag of this.lagen) {
      laag.sprite.tilePositionX += (laag.snelheid * delta) / 16;
    }
    // In zes seconden leeg of vol; de vier beelden tonen het laadniveau.
    const richting = this.dagNacht.nacht >= 0.5 ? 1 : -1;
    this.batterijLading = Math.max(
      0,
      Math.min(1, this.batterijLading + (richting * delta) / 6000),
    );
    this.figuur.setFrame(Math.round((1 - this.batterijLading) * 6));
  }

  maakLucht() {
    this.lucht = this.add.graphics();
    this.lucht.fillGradientStyle(
      KLEUR.luchtBoven,
      KLEUR.luchtBoven,
      KLEUR.luchtOnder,
      KLEUR.luchtOnder,
      1,
    );
    this.lucht.fillRect(0, 0, W, H);
  }

  maakZon() {
    this.zon = this.add.image(470, 170, "zon");
    this.tweens.add({
      targets: this.zon,
      scale: 1.12,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  maakSter() {
    this.sterren = this.add.container(0, 0).setDepth(2).setAlpha(0);
    const plekken = [
      [110, 370, 20],
      [45, 310, 9],
      [200, 325, 12],
      [310, 285, 9],
      [400, 340, 15],
      [530, 310, 11],
      [560, 65, 10],
      [350, 70, 12],
      [305, 155, 8],
      [400, 235, 9],
      [70, 440, 10],
      [490, 410, 12],
    ];
    plekken.forEach(([x, y, straal], index) => {
      const ster = this.add.star(x, y, 5, straal * 0.45, straal, KLEUR.ster);
      this.sterren.add(ster);
      this.tweens.add({
        targets: ster,
        alpha: 0.35,
        scale: 0.8,
        duration: 900 + index * 120,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });
  }

  maakWolken() {
    this.wolken = this.add.container(0, 0).setDepth(2);
    // Getekende wolken hebben geen rechthoekige achtergrond.
    [
      [120, 335, 1],
      [365, 110, 0.7],
      [455, 290, 0.85],
    ].forEach(([x, y, schaal]) => {
      const wolk = this.add.graphics({ x, y }).setScale(schaal);
      wolk.fillStyle(0xffffff, 0.95);
      wolk.fillRoundedRect(-65, -5, 130, 40, 20);
      wolk.fillCircle(-30, -5, 28);
      wolk.fillCircle(5, -20, 36);
      wolk.fillCircle(37, -1, 27);
      this.wolken.add(wolk);
      this.tweens.add({
        targets: wolk,
        x: x + 30,
        duration: 5000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });
  }

  maakDagNacht() {
    // Een donkere lucht boven de daglucht, maar achter zon, maan en landschap.
    this.nachtLucht = this.add.graphics().setDepth(0.5).setAlpha(0);
    this.nachtLucht.fillGradientStyle(
      0x080e26,
      0x080e26,
      0x24365a,
      0x24365a,
      1,
    );
    this.nachtLucht.fillRect(0, 0, W, H);

    this.maan = this.add
      .graphics({ x: this.zon.x, y: this.zon.y })
      .setDepth(1)
      .setAlpha(0);
    const straal = this.zon.displayWidth * 0.38;
    this.maan.fillStyle(0xeef2ff, 1);
    this.maan.fillCircle(0, 0, straal);
    this.maan.fillStyle(0xc4cde3, 1);
    this.maan.fillCircle(-straal * 0.3, -straal * 0.25, straal * 0.2);
    this.maan.fillCircle(straal * 0.35, straal * 0.15, straal * 0.25);
    this.maan.fillCircle(-straal * 0.15, straal * 0.5, straal * 0.12);

    const overgang = (this.dagNacht = { nacht: 0 });
    const mengKleur = (dag, nacht, deel) => {
      const kanaal = (shift) =>
        Math.round(
          ((dag >> shift) & 255) * (1 - deel) + ((nacht >> shift) & 255) * deel,
        );
      return (kanaal(16) << 16) | (kanaal(8) << 8) | kanaal(0);
    };

    // Elke zes seconden wisselen; de overgang zelf duurt twee seconden.
    this.tweens.add({
      targets: overgang,
      nacht: 1,
      delay: 6000,
      duration: 2000,
      hold: 6000,
      repeatDelay: 6000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        const deel = overgang.nacht;
        this.nachtLucht.setAlpha(deel);
        this.zon.setAlpha(1 - deel);
        this.maan.setAlpha(deel);
        this.wolken.setAlpha(1 - deel);
        this.sterren.setAlpha(deel);
        this.confetti.emitting = deel < 0.5;
        this.confetti.setAlpha(Math.max(0, 1 - deel * 2));
        this.regen.emitting = deel >= 0.5;
        this.regen.setAlpha(Math.max(0, deel * 2 - 1));
        this.bliksem.setAlpha(Math.max(0, deel * 2 - 1));
        if (deel < 0.5) {
          this.bliksem.stop().setVisible(false);
        }
        for (const laag of this.lagen) {
          laag.sprite.setTint(mengKleur(0xffffff, 0x52658a, deel));
        }
        this.titel.setColor(
          `#${mengKleur(KLEUR.donker, 0xeef2ff, deel).toString(16).padStart(6, "0")}`,
        );
        this.subtitel.setColor(
          `#${mengKleur(KLEUR.blauw, 0xbacbea, deel).toString(16).padStart(6, "0")}`,
        );
      },
    });
  }

  maakHeuvels() {
    // Een tileSprite herhaalt zijn plaatje, zodat hij eindeloos kan schuiven.
    // De plaatjes hebben onderaan 4 lege pixels; daarom staan ze 4 pixels onder de rand.
    const laag = (sleutel, hoogte, snelheid, diepte) => ({
      sprite: this.add
        .tileSprite(W / 2, H + 4, W, hoogte, sleutel)
        .setOrigin(0.5, 1)
        .setDepth(diepte),
      snelheid,
    });
    this.lagen = [
      laag("heuvel-achter", 334, 0.15, 3),
      laag("heuvel-midden", 254, 0.4, 4),
      laag("heuvel-voor", 174, 0.9, 6),
    ];
  }

  maakFiguur() {
    this.maakBatterijFrames();
    this.figuur = this.add.sprite(300, 560, "batterij-zeven-standen", 0);
    // Frame 0 is vol (groen), frame 6 is helemaal leeg (wit).
    this.batterijLading = 1;
    // Bewaar de tween, zodat hij later even te pauzeren is.
    this.dobber = this.tweens.add({
      targets: this.figuur,
      y: this.figuur.y - 12,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  maakBatterijFrames() {
    if (this.textures.exists("batterij-zeven-standen")) return;
    const textuur = this.textures.createCanvas("batterij-zeven-standen", 132 * 7, 259);
    const context = textuur.getContext();
    context.imageSmoothingEnabled = false;
    const origineel = this.textures.get("batterij-mannetje").getSourceImage();
    [0, 277, 555, 832].forEach((x, frame) => {
      context.drawImage(origineel, x, 0, 132, 259, frame * 132, 0, 132, 259);
    });
    const extra = this.textures.get("batterij-extra").getSourceImage();
    [313, 646, 978].forEach((x, index) => {
      const doelX = (index + 4) * 132;
      context.drawImage(extra, x, 504, 158, 313, doelX, 0, 132, 259);
      const beeld = context.getImageData(doelX, 0, 132, 259);
      // Alleen de witte buitenruimte verwijderen; het witte lichaam blijft staan.
      const bezocht = new Uint8Array(132 * 259);
      const stapel = [];
      for (let kolom = 0; kolom < 132; kolom++) stapel.push(kolom, 258 * 132 + kolom);
      for (let rij = 0; rij < 259; rij++) stapel.push(rij * 132, rij * 132 + 131);
      while (stapel.length) {
        const pixel = stapel.pop();
        if (bezocht[pixel]) continue;
        bezocht[pixel] = 1;
        const offset = pixel * 4;
        if (beeld.data[offset] < 220 || beeld.data[offset + 1] < 220 || beeld.data[offset + 2] < 220) continue;
        beeld.data[offset + 3] = 0;
        const kolom = pixel % 132;
        if (kolom > 0) stapel.push(pixel - 1);
        if (kolom < 131) stapel.push(pixel + 1);
        if (pixel >= 132) stapel.push(pixel - 132);
        if (pixel < 132 * 258) stapel.push(pixel + 132);
      }
      context.putImageData(beeld, doelX, 0);
    });
    for (let frame = 0; frame < 7; frame++) {
      textuur.add(frame, 0, frame * 132, 0, 132, 259);
    }
    textuur.refresh();
  }

  maakTitel() {
    this.titel = this.add.text(48, 52, "Hamza\nAfkir", {
      fontFamily: LETTER,
      fontSize: "84px",
      fontStyle: "bold",
      color: "#1d3557",
      lineSpacing: -14,
    });
    this.subtitel = this.add.text(52, 244, "Een poster die iets verteld", {
      fontFamily: LETTER,
      fontSize: "28px",
      color: "#457b9d",
    });
  }

  maakInfo() {
    this.info = this.add.text(
      40,
      740,
      "Minor Applied Motion Design\n Grafisch lyceum Rotterdam",
      {
        fontFamily: LETTER,
        fontSize: "22px",
        fontStyle: "bold",
        color: "#ffffff",
      },
    );
  }

  // De intro als één reeks: titel, subtitel, figuur en dan de info.
  maakTimeline() {
    const titelY = this.titel.y;
    const subtitelY = this.subtitel.y;

    this.titel.setY(titelY + 80).setAlpha(0);
    this.subtitel.setY(subtitelY + 40).setAlpha(0);
    this.figuur.setScale(0);
    this.info.setAlpha(0);

    this.tweens.chain({
      tweens: [
        {
          targets: this.titel,
          y: titelY,
          alpha: 1,
          duration: 900,
          delay: 300,
          ease: "Back.easeOut",
        },
        {
          targets: this.subtitel,
          y: subtitelY,
          alpha: 1,
          duration: 500,
          ease: "Cubic.easeOut",
        },
        { targets: this.figuur, scale: 1, duration: 600, ease: "Back.easeOut" },
        { targets: this.info, alpha: 1, duration: 600 },
      ],
    });
  }

  // Depth bepaalt wat voor wat ligt. Hoger = meer naar voren.
  zetDiepte() {
    this.lucht.setDepth(0);
    this.zon.setDepth(1);
    this.sterren.setDepth(2);
    this.figuur.setDepth(5); // tussen de middelste en de voorste heuvel
    this.titel.setDepth(10);
    this.subtitel.setDepth(10);
    this.info.setDepth(11);
  }

  maakConfetti() {
    this.confetti = this.add.particles(0, -20, "confetti", {
      x: { min: 0, max: W },
      lifespan: 9000,
      speedY: { min: 50, max: 110 },
      speedX: { min: -25, max: 25 },
      rotate: { start: 0, end: 720 },
      scale: { min: 0.6, max: 1.2 },
      frequency: 220,
      tint: [KLEUR.accent, KLEUR.ster, KLEUR.blauw, KLEUR.groen],
    });
    // Achter de heuvels, voor de lucht: zo valt de confetti "achter" het landschap.
    this.confetti.setDepth(2.5);
  }

  maakBliksem() {
    // De spritesheet bevat acht kolommen en vier rijen.
    const textuur = this.textures.get("bliksem");
    const bron = textuur.getSourceImage();
    for (let frame = 0; frame < 32; frame++) {
      const kolom = frame % 8;
      const rij = Math.floor(frame / 8);
      const x = Math.round((kolom * bron.width) / 8);
      const y = Math.round((rij * bron.height) / 4);
      if (!textuur.has(frame)) {
        textuur.add(
          frame,
          0,
          x,
          y,
          Math.round(((kolom + 1) * bron.width) / 8) - x,
          Math.round(((rij + 1) * bron.height) / 4) - y,
        );
      }
    }
    if (!this.anims.exists("bliksem-flits")) {
      this.anims.create({
        key: "bliksem-flits",
        frames: this.anims.generateFrameNumbers("bliksem", {
          start: 0,
          end: 31,
        }),
        frameRate: 24,
        repeat: 0,
      });
    }
    this.bliksem = this.add
      .sprite(400, 340, "bliksem", 0)
      .setDepth(8)
      .setScale(1.5)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0)
      .setVisible(false);
    this.bliksem.on("animationcomplete", () => this.bliksem.setVisible(false));
    this.time.addEvent({
      delay: 3000,
      loop: true,
      callback: () => {
        if (this.dagNacht.nacht >= 0.8) {
          this.bliksem
            .setPosition(Phaser.Math.Between(130, W - 130), 340)
            .setVisible(true)
            .play("bliksem-flits");
        }
      },
    });
  }

  maakRegen() {
    // Zoals in het min/max-voorbeeld krijgt elke druppel een eigen startplek.
    this.regen = this.add
      .particles(0, -40, "regen", {
        x: { min: -40, max: W + 40 },
        quantity: 2,
        frequency: 25,
        lifespan: 2200,
        speedY: { min: 420, max: 600 },
        speedX: { min: -35, max: -15 },
        gravityY: 200,
        scale: { min: 0.3, max: 0.6 },
        alpha: { min: 0.35, max: 0.65 },
        emitting: false,
      })
      .setDepth(7)
      .setAlpha(0);
  }

  // ★ Nieuw in deze stap
  // Op de interactieve poster is het camera-effect weer subtiel, zodat de knop in beeld blijft.
  maakCameraBeweging() {
    this.tweens.add({
      targets: this.cameras.main,
      zoom: 1.06,
      duration: 5000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  maakKnop() {
    const breedte = 170;
    const hoogte = 56;
    const vorm = this.add.graphics();
    vorm
      .fillStyle(KLEUR.accent, 1)
      .fillRoundedRect(-breedte / 2, -hoogte / 2, breedte, hoogte, hoogte / 2);
    const tekst = this.add
      .text(0, 0, "Doe mee!", {
        fontFamily: LETTER,
        fontSize: "26px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // Een container groepeert vorm en tekst; setSize geeft hem een klikbaar vlak.
    this.knop = this.add
      .container(470, 752, [vorm, tekst])
      .setSize(breedte, hoogte)
      .setDepth(12);
    this.knop.setInteractive({ useHandCursor: true });

    this.knop.on("pointerover", () => {
      this.tweens.add({
        targets: this.knop,
        scale: 1.12,
        duration: 150,
        ease: "Back.easeOut",
      });
    });
    this.knop.on("pointerout", () => {
      this.tweens.add({
        targets: this.knop,
        scale: 1,
        duration: 150,
        ease: "Cubic.easeOut",
      });
    });
  }
}
