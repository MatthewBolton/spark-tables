// dice-roller.js — Dice Roller component for Mythic Bastionland Spark Tables
// Compiled from JSX; depends on React + ReactDOM already present on window.
// Mounts into <div id="dice-root">.
// Optionally integrates with window.__diceBox (set by dice-box-init module script).
(function () {
  var _React = React;
  var useState = _React.useState,
    useCallback = _React.useCallback,
    useEffect = _React.useEffect;

  var DICE_TYPES_DR = [
    { die: "d4",  sides: 4  },
    { die: "d6",  sides: 6  },
    { die: "d8",  sides: 8  },
    { die: "d10", sides: 10 },
    { die: "d12", sides: 12 },
    { die: "d20", sides: 20 },
  ];

  var EMPTY_POOL_DR = { d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0 };

  var QUICK_ROLLS_DR = [
    { label: "2d12 Spark", pool: { d4:0, d6:0, d8:0, d10:0, d12:2, d20:0 } },
    { label: "1d20 Save",  pool: { d4:0, d6:0, d8:0, d10:0, d12:0, d20:1 } },
    { label: "d12+d6",     pool: { d4:0, d6:1, d8:0, d10:0, d12:1, d20:0 } },
    { label: "2d6 Squire", pool: { d4:0, d6:2, d8:0, d10:0, d12:0, d20:0 } },
  ];

  var DICE_PATHS_DR = {
    d4:  "M12 2 L22 20 L2 20 Z",
    d6:  "M4 4 H20 V20 H4 Z",
    d8:  "M12 2 L22 12 L12 22 L2 12 Z",
    d10: "M12 2 L21 8.5 L18 19.5 L6 19.5 L3 8.5 Z",
    d12: "M12 2 L19.5 6.5 L21.5 15 L16 21 L8 21 L2.5 15 L4.5 6.5 Z",
    d20: "M12 2 L22 9 L18 21 L6 21 L2 9 Z",
  };

  function drRand(sides) {
    var arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return (arr[0] % sides) + 1;
  }

  function drGetDieStyle(value, isHighest, allocated) {
    if (value >= 8) return {
      bg:         allocated ? "rgba(120,60,0,0.18)"   : "rgba(120,60,0,0.5)",
      border:     allocated ? "rgba(232,160,32,0.2)"  : "#e8a020",
      glow:       allocated ? "none"                  : "0 0 12px rgba(232,160,32,0.45)",
      valueColor: allocated ? "rgba(255,209,102,0.3)" : "#ffd166",
      label: "STRONG", labelColor: allocated ? "rgba(232,160,32,0.3)" : "#e8a020",
    };
    if (value >= 4) return {
      bg:         allocated ? "rgba(80,80,0,0.12)"    : "rgba(80,80,0,0.35)",
      border:     allocated ? "rgba(184,176,0,0.18)"  : "#b8b000",
      glow:       allocated ? "none"                  : "0 0 8px rgba(184,176,0,0.3)",
      valueColor: allocated ? "rgba(232,223,96,0.3)"  : "#e8df60",
      label: "GAMBIT", labelColor: allocated ? "rgba(184,176,0,0.3)" : "#b8b000",
    };
    return {
      bg:         allocated ? "rgba(18,16,12,0.5)"     : "rgba(30,28,24,0.8)",
      border:     allocated ? "rgba(60,56,48,0.35)" : isHighest ? "rgba(200,169,110,0.6)" : "rgba(80,75,65,0.6)",
      glow:       (!allocated && isHighest) ? "0 0 6px rgba(200,169,110,0.2)" : "none",
      valueColor: allocated ? "rgba(180,172,152,0.28)" : "#EAD8B8",
      label: null, labelColor: null,
    };
  }

  function DrDieIcon(props) {
    var die = props.die;
    var size = props.size !== undefined ? props.size : 20;
    var color = props.color || "#E2C08D";
    return /*#__PURE__*/React.createElement("svg", {
      width: size, height: size, viewBox: "0 0 24 24", fill: "none",
      style: { display: "block" }
    }, /*#__PURE__*/React.createElement("path", {
      d: DICE_PATHS_DR[die], stroke: color, strokeWidth: "1.5",
      fill: "none", strokeLinejoin: "round"
    }));
  }

  function DrDieChip(props) {
    var result = props.result;
    var isHighest = props.isHighest;
    var allocated = props.allocated;
    var onToggle = props.onToggle;
    var entryIndex = props.entryIndex;
    var s = drGetDieStyle(result.value, isHighest, allocated);
    return /*#__PURE__*/React.createElement("div", {
      onClick: onToggle,
      title: allocated ? "Click to return to pool" : "Click to allocate",
      style: {
        background: s.bg,
        border: "2px solid " + s.border,
        boxShadow: s.glow,
        borderRadius: "5px",
        padding: "0.45rem 0.6rem",
        minWidth: "56px",
        textAlign: "center",
        cursor: "pointer",
        userSelect: "none",
        transition: "background 0.18s, border-color 0.18s, box-shadow 0.18s",
        animation: allocated ? "none" : "diceReveal 0.25s ease-out both",
        animationDelay: allocated ? "0s" : (entryIndex * 0.06) + "s",
        position: "relative",
      }
    },
      isHighest && !allocated
        ? /*#__PURE__*/React.createElement("div", {
            style: { fontSize: "0.52rem", color: "#B0A080", lineHeight: 1, marginBottom: "0.1rem", letterSpacing: "0.05em" }
          }, "\u2605 HIGH")
        : null,
      /*#__PURE__*/React.createElement("div", {
        style: { fontSize: "1.5rem", fontWeight: "bold", color: s.valueColor, lineHeight: 1 }
      }, result.value),
      /*#__PURE__*/React.createElement("div", {
        style: { fontSize: "0.58rem", color: allocated ? "rgba(74,72,64,0.4)" : "#7A7060", marginTop: "0.1rem" }
      }, result.die),
      s.label
        ? /*#__PURE__*/React.createElement("div", {
            style: { fontSize: "0.52rem", color: s.labelColor, letterSpacing: "0.08em", marginTop: "0.18rem" }
          }, s.label)
        : null,
      allocated
        ? /*#__PURE__*/React.createElement("div", {
            style: { position: "absolute", bottom: "2px", right: "4px", fontSize: "0.45rem", color: "rgba(100,90,70,0.4)", letterSpacing: "0.04em", pointerEvents: "none" }
          }, "used")
        : null
    );
  }

  function DiceRoller() {
    var s0 = useState(false);        var isOpen = s0[0],        setIsOpen         = s0[1];
    var s1 = useState(Object.assign({}, EMPTY_POOL_DR));
                                     var pool  = s1[0],        setPool           = s1[1];
    var s2 = useState([]);           var results = s2[0],      setResults        = s2[1];
    var s3 = useState(new Set());    var allocatedUids = s3[0],setAllocatedUids  = s3[1];
    var s4 = useState(false);        var isRolling = s4[0],    setIsRolling      = s4[1];
    var s5 = useState(0);            var rollKey = s5[0],      setRollKey        = s5[1];
    var s6 = useState(false);        var use3D = s6[0],        setUse3D          = s6[1];
    var s7 = useState(false);        var dice3DReady = s7[0],  setDice3DReady    = s7[1];

    useEffect(function () {
      if (window.__diceBoxReady) { setDice3DReady(true); return; }
      function handler() { setDice3DReady(true); }
      document.addEventListener("dicebox-ready", handler);
      return function () { document.removeEventListener("dicebox-ready", handler); };
    }, []);

    useEffect(function () {
      if (dice3DReady) {
        setUse3D(true);
      }
    }, [dice3DReady]);

    useEffect(function () {
      var diceRoot = document.getElementById("dice-root");
      if (!diceRoot) return;

      function syncHeight() {
        document.documentElement.style.setProperty("--dice-root-height", diceRoot.offsetHeight + "px");
      }

      syncHeight();

      if (typeof ResizeObserver === "undefined") {
        window.addEventListener("resize", syncHeight);
        return function () {
          window.removeEventListener("resize", syncHeight);
          document.documentElement.style.removeProperty("--dice-root-height");
        };
      }

      var observer = new ResizeObserver(syncHeight);
      observer.observe(diceRoot);
      window.addEventListener("resize", syncHeight);

      return function () {
        observer.disconnect();
        window.removeEventListener("resize", syncHeight);
        document.documentElement.style.removeProperty("--dice-root-height");
      };
    }, [isOpen, results.length, allocatedUids.size]);

    var totalDice = DICE_TYPES_DR.reduce(function (acc, d) { return acc + pool[d.die]; }, 0);
    var poolSummary = DICE_TYPES_DR
      .filter(function (d) { return pool[d.die] > 0; })
      .map(function (d) { return pool[d.die] + d.die; })
      .join(" + ");

    function addDie(die) {
      setPool(function (p) { var n = Object.assign({}, p); n[die] = p[die] + 1; return n; });
    }
    function removeDie(die) {
      setPool(function (p) { var n = Object.assign({}, p); n[die] = Math.max(0, p[die] - 1); return n; });
    }
    function applyPreset(preset) {
      setPool(Object.assign({}, preset.pool));
      setResults([]);
      setAllocatedUids(new Set());
    }
    function clearAll() {
      setPool(Object.assign({}, EMPTY_POOL_DR));
      setResults([]);
      setAllocatedUids(new Set());
      if (window.__diceBox) {
        try { window.__diceBox.clear(); } catch (_) {}
      }
      hideDiceBoxOverlay(true);
    }

    function buildResultsFromValues(valuesBySides) {
      var r = [];
      DICE_TYPES_DR.forEach(function (ref) {
        var die = ref.die;
        var sides = ref.sides;
        var values = valuesBySides[sides] || [];
        for (var i = 0; i < pool[die]; i++) {
          var value = values.length > 0 ? values.shift() : drRand(sides);
          r.push({ die: die, sides: sides, value: value, uid: die + "-" + i + "-" + Math.random() });
        }
      });
      return r;
    }

    function syncDiceCanvasSize(retries) {
      var boxElement = document.getElementById("dice-box");
      if (!boxElement) return;
      var canvas = boxElement.querySelector("canvas");
      if (!canvas) {
        if (retries > 0) {
          window.setTimeout(function () { syncDiceCanvasSize(retries - 1); }, 60);
        }
        return;
      }

      var rect = boxElement.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      var targetW = Math.max(1, Math.floor(rect.width * dpr));
      var targetH = Math.max(1, Math.floor(rect.height * dpr));

      // IMPORTANT: assigning canvas.width/height clears the WebGL context even with
      // preserveDrawingBuffer:true. Only resize if dimensions actually changed.
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.style.width = rect.width + "px";
        canvas.style.height = rect.height + "px";
        canvas.width = targetW;
        canvas.height = targetH;
        if (window.__diceBox && typeof window.__diceBox.resizeWorld === "function") {
          try { window.__diceBox.resizeWorld(); } catch (_) {}
        }
      }
    }

    function showDiceBoxOverlay() {
      var container = document.getElementById("dice-box-container");
      if (!container) return;

      container.style.visibility = "visible";
      container.style.opacity = "1";
      container.style.pointerEvents = "none";

      window.requestAnimationFrame(function () {
        syncDiceCanvasSize(14);
      });
    }

    function clearDiceSnapshot() {
      var boxElement = document.getElementById("dice-box");
      var snapshot = document.getElementById("dice-box-snapshot");
      if (snapshot) {
        snapshot.style.opacity = "0";
        snapshot.removeAttribute("src");
      }
      if (boxElement) {
        boxElement.style.opacity = "1";
      }
    }

    function captureDiceSnapshot() {
      var boxElement = document.getElementById("dice-box");
      var snapshot = document.getElementById("dice-box-snapshot");
      if (!boxElement || !snapshot) return;
      var canvas = boxElement.querySelector("canvas");
      if (!canvas) return;
      try {
        var image = canvas.toDataURL("image/png");
        if (image && image.length > 1000) {
          snapshot.src = image;
          snapshot.style.opacity = "1";
          // Freeze on the captured frame to prevent duplicate/offset live redraws
          // when the bottom roller height changes after results populate.
          boxElement.style.opacity = "0";
        }
      } catch (_) {}
    }

    function hideDiceBoxOverlay(hardHide) {
      var container = document.getElementById("dice-box-container");
      if (!container) return;
      if (hardHide) {
        container.style.opacity = "0";
        container.style.visibility = "hidden";
        clearDiceSnapshot();
      }
      container.style.pointerEvents = "none";
    }

    useEffect(function () {
      var container = document.getElementById("dice-box-container");
      if (!container) return;
      var has3DResults = use3D && results.length > 0;

      if (!has3DResults) {
        container.style.transform = "translateX(0)";
        return;
      }

      // Keep overlay fixed while allocating to avoid visual doubling/jitter.
      container.style.transform = "translateX(0)";
      container.style.transition = "opacity 120ms ease";
    }, [allocatedUids.size, results.length, use3D]);

    var rollDice = useCallback(function () {
      if (totalDice === 0 || isRolling) return;
      setIsRolling(true);
      setResults([]);
      setAllocatedUids(new Set());

      if (use3D && window.__diceBox) {
        // Build per-group notations (one per die type) to work around dice-box 1.1.4
        // compound notation limitation — only the first die group renders with roll().
        var groups = DICE_TYPES_DR
          .filter(function (d) { return pool[d.die] > 0; })
          .map(function (d) { return { notation: pool[d.die] + "d" + d.sides, sides: d.sides, count: pool[d.die] }; });

        clearDiceSnapshot();
        showDiceBoxOverlay();
        var box = window.__diceBox;
        box.clear();

        var TIMEOUT_MS = 6000;
        var allResults3d = [];

        function collectResults(results3d) {
          if (results3d && results3d.length) {
            results3d.forEach(function (r) { allResults3d.push(r); });
          }
        }

        function finishRoll() {
          showDiceBoxOverlay();
          captureDiceSnapshot();
          var valuesBySides = {};
          allResults3d.forEach(function (result) {
            if (!valuesBySides[result.sides]) valuesBySides[result.sides] = [];
            valuesBySides[result.sides].push(result.value);
          });
          if (allResults3d.length === 0) {
            console.warn("3D roll: no results returned; using local fallback.");
          }
          var r = buildResultsFromValues(valuesBySides);
          setResults(r);
          setRollKey(function (k) { return k + 1; });
          setIsRolling(false);
        }

        // Roll first group with roll(), fire subsequent groups with add() after a short
        // stagger — don't wait for previous group to settle before launching next.
        // This gives overlapping waves rather than strict sequential rolling.
        var rollPromise;
        if (groups.length === 0) {
          finishRoll();
          return;
        }

        var promises = [];
        promises.push(Promise.race([
          box.roll(groups[0].notation),
          new Promise(function (resolve) { window.setTimeout(function () { resolve(null); }, TIMEOUT_MS); })
        ]));

        for (var i = 1; i < groups.length; i++) {
          (function (group, staggerMs) {
            var p = new Promise(function (resolve) {
              window.setTimeout(function () {
                var addFn = typeof box.add === "function" ? box.add.bind(box) : box.roll.bind(box);
                Promise.race([
                  addFn(group.notation),
                  new Promise(function (res) { window.setTimeout(function () { res(null); }, TIMEOUT_MS); })
                ]).then(resolve).catch(function () { resolve(null); });
              }, staggerMs);
            });
            promises.push(p);
          })(groups[i], i * 250); // 250 ms stagger — dice launch in overlapping waves
        }

        rollPromise = Promise.all(promises).then(function (allResults) {
          allResults.forEach(function (r) { collectResults(r); });
        });

        rollPromise.then(finishRoll).catch(function (e) {
          console.warn("3D roll error:", e);
          hideDiceBoxOverlay(true);
          setIsRolling(false);
        });

      } else {
        setTimeout(function () {
          var r = buildResultsFromValues({});
          setResults(r);
          setRollKey(function (k) { return k + 1; });
          setIsRolling(false);
        }, 350);
      }
    }, [pool, totalDice, isRolling, use3D]);

    function toggleAllocate(uid) {
      setAllocatedUids(function (prev) {
        var next = new Set(prev);
        if (next.has(uid)) { next.delete(uid); } else { next.add(uid); }
        return next;
      });
    }

    var activeResults    = results.filter(function (r) { return !allocatedUids.has(r.uid); });
    var allocatedResults = results.filter(function (r) { return  allocatedUids.has(r.uid); });
    var maxActiveVal     = activeResults.length > 0 ? Math.max.apply(null, activeResults.map(function (r) { return r.value; })) : -1;
    var activeTotal      = activeResults.reduce(function (acc, r) { return acc + r.value; }, 0);
    var gambits          = activeResults.filter(function (r) { return r.value >= 4; }).length;
    var strongGambits    = activeResults.filter(function (r) { return r.value >= 8; }).length;
    var hasResults       = results.length > 0;
    var hasAllocated     = allocatedResults.length > 0;

    var colStyle   = { padding: "0.9rem 1rem" };
    var sectionLbl = { fontSize: "0.62rem", color: "#7A7060", letterSpacing: "0.14em", marginBottom: "0.6rem", display: "block" };

    return /*#__PURE__*/React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement("style", null,
        "@keyframes diceReveal { from { opacity: 0; transform: translateY(6px) scale(0.92); } to { opacity: 1; transform: translateY(0) scale(1); } }"
      ),
      /*#__PURE__*/React.createElement("div", {
        style: {
          fontFamily: "'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif",
          background: "#0f0e0c",
          color: "#EAD8B8",
          borderTop: "2px solid #2a2620",
        }
      },
        // ── collapse toggle ──
        /*#__PURE__*/React.createElement("button", {
          onClick: function () { setIsOpen(function (o) {
            var next = !o;
            if (!next) hideDiceBoxOverlay(true); // hide 3D when collapsed
            return next;
          }); },
          style: {
            width: "100%", padding: "0.9rem 1.5rem", background: "#131210",
            border: "none", borderBottom: isOpen ? "1px solid #2a2620" : "none",
            color: "#E2C08D", fontSize: "0.95rem", fontFamily: "inherit",
            cursor: "pointer", display: "flex", justifyContent: "space-between",
            alignItems: "center", letterSpacing: "0.05em",
          }
        },
          /*#__PURE__*/React.createElement("span", {
            style: { display: "flex", alignItems: "center", gap: "0.6rem" }
          },
            /*#__PURE__*/React.createElement(DrDieIcon, { die: "d20", size: 18, color: "#E2C08D" }),
            "Dice Roller",
            !isOpen && poolSummary
              ? /*#__PURE__*/React.createElement("span", {
                  style: { fontSize: "0.75rem", color: "#B09060", marginLeft: "0.5rem" }
                }, "(" + poolSummary + ")")
              : null
          ),
          /*#__PURE__*/React.createElement("span", {
            style: { fontSize: "0.7rem", color: "#8A7A60", letterSpacing: "0.1em" }
          }, isOpen ? "\u25b2 COLLAPSE" : "\u25bc EXPAND")
        ),

        // ── body ──
        isOpen
          ? /*#__PURE__*/React.createElement("div", {
              style: { padding: "1.25rem 1.5rem", background: "#0f0e0c" }
            },

              dice3DReady
                ? /*#__PURE__*/React.createElement("div", {
                    style: { display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }
                  },
                    /*#__PURE__*/React.createElement("span", {
                      style: { fontSize: "0.7rem", color: "#8A7A60", letterSpacing: "0.1em" }
                    }, "MODE:"),
                    /*#__PURE__*/React.createElement("button", {
                      onClick: function () {
                        setUse3D(false);
                        hideDiceBoxOverlay(true);
                      },
                      style: {
                        padding: "0.25rem 0.7rem",
                        borderRadius: "3px",
                        border: "1px solid " + (!use3D ? "#E2C08D" : "#3A3028"),
                        background: !use3D ? "rgba(122,92,46,0.35)" : "rgba(30,28,24,0.6)",
                        color: !use3D ? "#EAD8B8" : "#8A7A60",
                        fontSize: "0.72rem",
                        fontFamily: "inherit",
                        cursor: "pointer"
                      }
                    }, "2D"),
                    /*#__PURE__*/React.createElement("button", {
                      onClick: function () {
                        setUse3D(true);
                        if (results.length > 0) showDiceBoxOverlay();
                      },
                      style: {
                        padding: "0.25rem 0.7rem",
                        borderRadius: "3px",
                        border: "1px solid " + (use3D ? "#66D9EF" : "#3A3028"),
                        background: use3D ? "rgba(102,217,239,0.18)" : "rgba(30,28,24,0.6)",
                        color: use3D ? "#66D9EF" : "#8A7A60",
                        fontSize: "0.72rem",
                        fontFamily: "inherit",
                        cursor: "pointer"
                      }
                    }, "3D"),
                    /*#__PURE__*/React.createElement("span", {
                      style: { fontSize: "0.68rem", color: use3D ? "#73C991" : "#8A7A60" }
                    }, use3D ? "3D ready" : "3D available")
                  )
                : null,

              // Quick rolls
              /*#__PURE__*/React.createElement("div", {
                style: { display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1.25rem", alignItems: "center" }
              },
                /*#__PURE__*/React.createElement("span", {
                  style: { fontSize: "0.7rem", color: "#8A7A60", marginRight: "0.2rem", letterSpacing: "0.1em" }
                }, "QUICK:"),
                QUICK_ROLLS_DR.map(function (preset) {
                  return /*#__PURE__*/React.createElement("button", {
                    key: preset.label,
                    onClick: function () { applyPreset(preset); },
                    style: {
                      padding: "0.25rem 0.65rem", background: "rgba(122,92,46,0.15)",
                      border: "1px solid rgba(200,169,110,0.3)", color: "#E2C08D",
                      borderRadius: "3px", cursor: "pointer", fontSize: "0.72rem", fontFamily: "inherit",
                    }
                  }, preset.label);
                })
              ),

              // Pool builder
              /*#__PURE__*/React.createElement("div", {
                style: {
                  display: "flex", flexWrap: "wrap", gap: "0.6rem", marginBottom: "1.25rem",
                  padding: "1rem", background: "rgba(20,18,14,0.8)",
                  border: "1px solid #1e1c18", borderRadius: "4px",
                }
              },
                DICE_TYPES_DR.map(function (ref) {
                  var die = ref.die;
                  var active = pool[die] > 0;
                  return /*#__PURE__*/React.createElement("div", {
                    key: die,
                    style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem", minWidth: "60px" }
                  },
                    /*#__PURE__*/React.createElement(DrDieIcon, { die: die, size: 20, color: active ? "#E2C08D" : "#7A7060" }),
                    /*#__PURE__*/React.createElement("span", {
                      style: {
                        fontSize: "0.75rem",
                        color: active ? "#E2C08D" : "#7A7060",
                        letterSpacing: "0.05em",
                        fontWeight: active ? "bold" : "normal",
                      }
                    }, die),
                    /*#__PURE__*/React.createElement("div", {
                      style: { display: "flex", alignItems: "center", gap: "0.25rem" }
                    },
                      /*#__PURE__*/React.createElement("button", {
                        onClick: function () { removeDie(die); },
                        disabled: !active,
                        style: {
                          width: "24px", height: "24px",
                          background: active ? "rgba(122,92,46,0.25)" : "transparent",
                          border: "1px solid " + (active ? "rgba(200,169,110,0.4)" : "#2a2620"),
                          color: active ? "#E2C08D" : "#333",
                          borderRadius: "3px", cursor: active ? "pointer" : "default",
                          fontSize: "1rem", lineHeight: 1,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }
                      }, "\u2212"),
                      /*#__PURE__*/React.createElement("span", {
                        style: { width: "20px", textAlign: "center", fontSize: "0.95rem", fontWeight: "bold", color: active ? "#fff" : "#7A7060" }
                      }, pool[die]),
                      /*#__PURE__*/React.createElement("button", {
                        onClick: function () { addDie(die); },
                        style: {
                          width: "24px", height: "24px", background: "rgba(122,92,46,0.2)",
                          border: "1px solid rgba(200,169,110,0.35)", color: "#E2C08D",
                          borderRadius: "3px", cursor: "pointer", fontSize: "1rem", lineHeight: 1,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }
                      }, "+")
                    )
                  );
                })
              ),

              // Action row
              /*#__PURE__*/React.createElement("div", {
                style: { display: "flex", gap: "0.6rem", alignItems: "center", marginBottom: "1.25rem" }
              },
                /*#__PURE__*/React.createElement("button", {
                  onClick: rollDice,
                  disabled: totalDice === 0 || isRolling,
                  style: {
                    padding: "0.55rem 1.75rem",
                    background: totalDice > 0 ? "rgba(122,92,46,0.5)" : "rgba(30,28,24,0.5)",
                    border: "1px solid " + (totalDice > 0 ? "#E2C08D" : "#2a2620"),
                    color: totalDice > 0 ? "#e8d0a0" : "#7A7060",
                    borderRadius: "3px",
                    cursor: totalDice > 0 && !isRolling ? "pointer" : "default",
                    fontSize: "0.95rem", fontFamily: "inherit", letterSpacing: "0.08em",
                    opacity: isRolling ? 0.7 : 1,
                  }
                }, isRolling ? "Rolling\u2026" : totalDice > 0 ? "Roll " + poolSummary : "Roll Dice"),
                totalDice > 0 || hasResults
                  ? /*#__PURE__*/React.createElement("button", {
                      onClick: clearAll,
                      style: {
                        padding: "0.5rem 0.85rem", background: "transparent",
                        border: "1px solid #2a2620", color: "#8A7A60",
                        borderRadius: "3px", cursor: "pointer", fontSize: "0.8rem", fontFamily: "inherit",
                      }
                    }, "Clear")
                  : null
              ),

              // Results panel
              hasResults
                ? /*#__PURE__*/React.createElement("div", {
                    key: rollKey,
                    style: {
                      background: "rgba(13,12,10,0.95)", border: "1px solid #1e1c18",
                      borderRadius: "4px", overflow: "hidden",
                      display: "grid",
                      gridTemplateColumns: hasAllocated ? "1fr 1px 1fr" : "1fr",
                    }
                  },
                    // In-play column
                    /*#__PURE__*/React.createElement("div", { style: colStyle },
                      /*#__PURE__*/React.createElement("span", { style: sectionLbl },
                        "IN PLAY" + (activeResults.length > 0 ? " \u2014 tap to allocate" : "")
                      ),
                      activeResults.length > 0
                        ? /*#__PURE__*/React.createElement(React.Fragment, null,
                            /*#__PURE__*/React.createElement("div", {
                              style: { display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.7rem" }
                            },
                              activeResults.map(function (r, i) {
                                return /*#__PURE__*/React.createElement(DrDieChip, {
                                  key: r.uid, result: r,
                                  isHighest: r.value === maxActiveVal,
                                  allocated: false,
                                  onToggle: function () { toggleAllocate(r.uid); },
                                  entryIndex: i,
                                });
                              })
                            ),
                            activeResults.length > 1
                              ? /*#__PURE__*/React.createElement("div", {
                                  style: { fontSize: "0.78rem", color: "#9A8A70", display: "flex", gap: "1rem", flexWrap: "wrap" }
                                },
                                  /*#__PURE__*/React.createElement("span", null,
                                    "Total ", /*#__PURE__*/React.createElement("strong", { style: { color: "#E2C08D" } }, activeTotal)
                                  ),
                                  gambits > 0
                                    ? /*#__PURE__*/React.createElement("span", { style: { color: "#C8C040" } },
                                        gambits + " gambit" + (gambits > 1 ? "s" : "") +
                                        (strongGambits > 0 ? " \u00b7 " + strongGambits + " strong" : "")
                                      )
                                    : null
                                )
                              : null
                          )
                        : /*#__PURE__*/React.createElement("p", {
                            style: { fontSize: "0.78rem", color: "#4A4840", fontStyle: "italic", margin: 0 }
                          }, "All allocated \u2014 tap any die to return it.")
                    ),
                    // Divider
                    hasAllocated
                      ? /*#__PURE__*/React.createElement("div", { style: { background: "#1e1c18", margin: "0.75rem 0" } })
                      : null,
                    // Allocated column
                    hasAllocated
                      ? /*#__PURE__*/React.createElement("div", { style: colStyle },
                          /*#__PURE__*/React.createElement("span", { style: sectionLbl }, "ALLOCATED \u2014 tap to return"),
                          /*#__PURE__*/React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: "0.5rem" } },
                            allocatedResults.map(function (r) {
                              return /*#__PURE__*/React.createElement(DrDieChip, {
                                key: r.uid, result: r, isHighest: false, allocated: true,
                                onToggle: function () { toggleAllocate(r.uid); }, entryIndex: 0,
                              });
                            })
                          )
                        )
                      : null
                  )
                : null
            )
          : null
      )
    );
  }

  // Mount
  var diceRoot = document.getElementById("dice-root");
  if (diceRoot) {
    ReactDOM.createRoot(diceRoot).render(
      /*#__PURE__*/React.createElement(DiceRoller, null)
    );
  }
})();
