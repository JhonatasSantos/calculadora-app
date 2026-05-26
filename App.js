import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  StyleSheet,
  Dimensions,
  Platform,
  Vibration,
} from 'react-native';

const { width, height } = Dimensions.get('window');
const BTN_GAP = 14;
const PADDING = 20;
const CALC_WIDTH = Math.min(width, 400);
const BTN_SIZE = (CALC_WIDTH - PADDING * 2 - BTN_GAP * 3) / 4;

const THEMES = {
  dark: {
    bg: '#121212',
    displayBg: '#1E1E1E',
    displayText: '#F0EDE8',
    displaySub: '#5A5550',
    numBg: '#2A2A2A',
    numText: '#F0EDE8',
    numShadowDark: '#0A0A0A',
    numShadowLight: '#3A3A3A',
    opBg: '#2E2218',
    opText: '#D4A96A',
    specBg: '#222222',
    specText: '#888480',
    accent: '#D4A96A',
    accentDark: '#9A5C1E',
    toggleBg: '#2A2A2A',
    border: '#2A2A2A',
  },
  light: {
    bg: '#F0EDE8',
    displayBg: '#E8E4DE',
    displayText: '#1A1614',
    displaySub: '#A0998F',
    numBg: '#FFFFFF',
    numText: '#1A1614',
    numShadowDark: '#C8C4BE',
    numShadowLight: '#FFFFFF',
    opBg: '#F5E8D0',
    opText: '#C97B3A',
    specBg: '#E8E4DE',
    specText: '#6A6560',
    accent: '#D4A96A',
    accentDark: '#C97B3A',
    toggleBg: '#E0DDD8',
    border: '#E0DDD8',
  },
};

const ROWS = [
  ['AC', '+/-', '%', '÷'],
  ['7',  '8',  '9',  '×'],
  ['4',  '5',  '6',  '−'],
  ['1',  '2',  '3',  '+'],
  ['0',  '.',  '='],
];

const OPS  = ['÷', '×', '−', '+'];
const SPEC = ['AC', '+/-', '%'];

function fmt(n) {
  if (typeof n !== 'number') return n;
  const s = parseFloat(n.toPrecision(10)).toString();
  return s.length > 11 ? parseFloat(n.toPrecision(6)).toString() : s;
}

function compute(a, b, op) {
  switch (op) {
    case '+': return a + b;
    case '−': return a - b;
    case '×': return a * b;
    case '÷': return b !== 0 ? a / b : 'Erro';
    default:  return b;
  }
}

export default function App() {
  const [dark, setDark]             = useState(true);
  const [display, setDisplay]       = useState('0');
  const [prev, setPrev]             = useState(null);
  const [op, setOp]                 = useState(null);
  const [fresh, setFresh]           = useState(false);
  const [expression, setExpression] = useState('');

  const t = THEMES[dark ? 'dark' : 'light'];

  const press = useCallback((val) => {
    if (Platform.OS === 'android') Vibration.vibrate(18);

    if (val === 'AC') {
      setDisplay('0'); setPrev(null); setOp(null);
      setFresh(false); setExpression('');
      return;
    }
    if (val === '+/-') {
      setDisplay(d => fmt(parseFloat(d) * -1));
      return;
    }
    if (val === '%') {
      setDisplay(d => fmt(parseFloat(d) / 100));
      return;
    }
    if (OPS.includes(val)) {
      setPrev(parseFloat(display));
      setOp(val);
      setExpression(display + ' ' + val);
      setFresh(true);
      return;
    }
    if (val === '=') {
      if (op && prev !== null) {
        const result = compute(prev, parseFloat(display), op);
        setExpression(expression + ' ' + display + ' =');
        setDisplay(result === 'Erro' ? 'Erro' : fmt(result));
        setPrev(null); setOp(null); setFresh(false);
      }
      return;
    }
    if (val === '.') {
      if (fresh) { setDisplay('0.'); setFresh(false); return; }
      if (!display.includes('.')) setDisplay(d => d + '.');
      return;
    }
    if (fresh || display === '0') {
      setDisplay(val); setFresh(false);
    } else {
      if (display.replace('-', '').replace('.', '').length >= 9) return;
      setDisplay(d => d + val);
    }
  }, [display, op, prev, fresh, expression]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]}>
      <StatusBar
        barStyle={dark ? 'light-content' : 'dark-content'}
        backgroundColor={t.bg}
      />
      <View style={[s.shell, { backgroundColor: t.bg }]}>

        <View style={s.topBar}>
          <Text style={[s.appTitle, { color: t.displaySub }]}>
            CALCULADORA
          </Text>
          <TouchableOpacity
            onPress={() => setDark(d => !d)}
            style={[s.toggle, { backgroundColor: t.toggleBg }]}
            activeOpacity={0.8}
          >
            <View style={[s.toggleThumb, {
              backgroundColor: t.accent,
              transform: [{ translateX: dark ? 26 : 2 }],
            }]}>
              <Text style={{ fontSize: 12 }}>{dark ? '🌙' : '☀️'}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={[s.display, {
          backgroundColor: t.displayBg,
          shadowColor: dark ? '#000' : '#A0998F',
        }]}>
          <Text style={[s.expression, { color: t.displaySub }]} numberOfLines={1}>
            {expression || ' '}
          </Text>
          <Text
            style={[s.displayNum, {
              color: t.displayText,
              fontSize: display.length > 9 ? 36
                      : display.length > 6 ? 52
                      : 68,
            }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {display}
          </Text>
          {op && <View style={[s.opDot, { backgroundColor: t.accent }]} />}
        </View>

        <View style={s.grid}>
          {ROWS.map((row, ri) => (
            <View key={ri} style={s.row}>
              {row.map((val) => {
                const isEq   = val === '=';
                const isOp   = OPS.includes(val);
                const isSpec = SPEC.includes(val);
                const isZero = val === '0';
                const btnW   = isZero ? BTN_SIZE * 2 + BTN_GAP : BTN_SIZE;
                const bg     = isEq ? t.accent : isOp ? t.opBg : isSpec ? t.specBg : t.numBg;
                const fg     = isEq ? '#FFFFFF' : isOp ? t.opText : isSpec ? t.specText : t.numText;

                return (
                  <TouchableOpacity
                    key={val}
                    onPress={() => press(val)}
                    activeOpacity={0.72}
                    style={[s.btn, {
                      width: btnW,
                      height: BTN_SIZE,
                      backgroundColor: bg,
                      shadowColor: isEq ? t.accentDark : t.numShadowDark,
                      borderColor: dark ? 'transparent' : t.border,
                    }]}
                  >
                    <Text style={[s.btnLabel, {
                      color: fg,
                      fontSize: isOp ? 28 : isEq ? 30 : isSpec ? 20 : 26,
                      textAlign: isZero ? 'left' : 'center',
                      paddingLeft: isZero ? BTN_SIZE * 0.28 : 0,
                    }]}>
                      {val}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        <Text style={[s.footer, { color: t.displaySub }]}>
          {dark ? '🌙 MODO ESCURO' : '☀️ MODO CLARO'}
        </Text>

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
  },
  shell: {
    flex: 1,
    paddingHorizontal: PADDING,
    paddingBottom: 16,
    paddingTop: 8,
    justifyContent: 'space-between',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  appTitle: {
    fontSize: 12,
    letterSpacing: 4,
  },
  toggle: {
    width: 58,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  display: {
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 22,
    minHeight: height * 0.18,
    justifyContent: 'flex-end',
    marginBottom: 18,
    shadowOffset: { width: 4, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  expression: {
    fontSize: 15,
    textAlign: 'right',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  displayNum: {
    textAlign: 'right',
    letterSpacing: -1,
    lineHeight: 72,
  },
  opDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  grid: {
    gap: BTN_GAP,
    flex: 1,
    justifyContent: 'flex-end',
  },
  row: {
    flexDirection: 'row',
    gap: BTN_GAP,
    justifyContent: 'flex-start',
  },
  btn: {
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 0.5,
  },
  btnLabel: {
    fontWeight: '300',
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    letterSpacing: 3,
    marginTop: 14,
    opacity: 0.5,
  },
});