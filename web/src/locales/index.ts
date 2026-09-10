import enDict from './en.json';
import deDict from './de.json';
import frDict from './fr.json';
import esDict from './es.json';
import ptDict from './pt.json';
import zh_cnDict from './zh-cn.json';
import zh_twDict from './zh-tw.json';
import jaDict from './ja.json';
import koDict from './ko.json';
import ruDict from './ru.json';
import itDict from './it.json';
import nlDict from './nl.json';
import plDict from './pl.json';
import trDict from './tr.json';
import ukDict from './uk.json';
import csDict from './cs.json';
import daDict from './da.json';
import fiDict from './fi.json';
import elDict from './el.json';
import huDict from './hu.json';
import ltDict from './lt.json';
import roDict from './ro.json';
import arDict from './ar.json';

export type UiDictionary = typeof enDict;

type DeepPartial<T> = T extends Function ? T : T extends Array<infer U> ? _DeepPartialArray<U> : T extends object ? _DeepPartialObject<T> : T | undefined;
type _DeepPartialObject<T> = { [P in keyof T]?: DeepPartial<T[P]> };
interface _DeepPartialArray<T> extends Array<DeepPartial<T>> {}

export const UI_DICTIONARIES: Record<string, DeepPartial<UiDictionary>> = {
  'en': enDict,
  'de': deDict,
  'fr': frDict,
  'es': esDict,
  'pt': ptDict,
  'zh-cn': zh_cnDict,
  'zh-tw': zh_twDict,
  'ja': jaDict,
  'ko': koDict,
  'ru': ruDict,
  'it': itDict,
  'nl': nlDict,
  'pl': plDict,
  'tr': trDict,
  'uk': ukDict,
  'cs': csDict,
  'da': daDict,
  'fi': fiDict,
  'el': elDict,
  'hu': huDict,
  'lt': ltDict,
  'ro': roDict,
  'ar': arDict
};

export { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, getLanguageByCode } from './languages';
export type { LanguageOption } from './languages';
