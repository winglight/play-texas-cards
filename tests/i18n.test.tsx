/* eslint-disable @typescript-eslint/no-explicit-any -- Node-only DOM and transport mocks */
import React from 'react';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import TestRenderer, { act } from 'react-test-renderer';
import { MemoryRouter } from 'react-router-dom';
import { LanguageSwitcher } from '../src/components/LanguageSwitcher';
import { GameSettings } from '../src/components/GameSettings';
import { TutorialModal } from '../src/components/TutorialModal';
import { Controls } from '../src/components/Controls';
import { Table } from '../src/components/Table';
import { SessionStats } from '../src/components/SessionStats';
import { ProbabilityCalculator } from '../src/components/ProbabilityCalculator';
import { MultiplayerPage } from '../src/pages/MultiplayerPage';
import { useGameStore } from '../src/store/gameStore';
import { translate, setLocale, getLocale, readStoredLocale, LOCALE_KEY, formatPlayerName } from '../src/i18n';
import { calculateEquity } from '../src/utils/probability';
import { evaluateHand } from '../src/utils/poker';
import { getAiAction } from '../src/utils/ai';
import type { Card } from '../src/types/poker';

const memory=new Map<string,string>();
const storage={getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>{memory.set(k,v);},removeItem:(k:string)=>{memory.delete(k);}};
(globalThis as any).window={localStorage:storage};
(globalThis as any).document={documentElement:{lang:'en'},title:'Poker Trainer',addEventListener(){},removeEventListener(){}};
(globalThis as any).fetch=()=>{throw new Error('Unexpected network request in test');};
(globalThis as any).WebSocket=class {constructor(){throw new Error('Unexpected socket in test');}};
useGameStore.persist.setOptions({storage:{getItem:k=>{const value=storage.getItem(k);return value?JSON.parse(value):null;},setItem:(k,v)=>storage.setItem(k,JSON.stringify(v)),removeItem:storage.removeItem}});
const state=()=>useGameStore.getState();
const settings={tableType:'nl' as const,playerCount:6 as const,bigBlind:20,maxBuyInBB:100,startingChips:2000};
const mount=(element:React.ReactElement)=>{let root:TestRenderer.ReactTestRenderer;act(()=>{root=TestRenderer.create(<MemoryRouter>{element}</MemoryRouter>);});return root!;};
const visible=(root:TestRenderer.ReactTestRenderer)=>JSON.stringify(root.toJSON());
const nodeText=(node:TestRenderer.ReactTestInstance|string):string=>typeof node==='string'?node:node.children.map(nodeText).join('');
const button=(root:TestRenderer.ReactTestRenderer,text:string)=>root.root.findAllByType('button').find(b=>nodeText(b).trim()===text)!;
const language=(root:TestRenderer.ReactTestRenderer,code:'en'|'zh')=>act(()=>root.root.findAllByType('button').find(b=>b.props.lang===(code==='zh'?'zh-CN':'en'))!.props.onClick());
const close=(root:TestRenderer.ReactTestRenderer)=>act(()=>root.unmount());

test('dictionary and dynamic messages use correct poker vocabulary and preserve user content',()=>{
  assert.equal(translate('Table Settings','zh'),'牌桌设置');
  assert.equal(translate('Players','zh'),'玩家人数');
  assert.equal(translate('Small Blind:','zh'),'小盲注：');
  assert.equal(translate('Full House','zh'),'葫芦');
  assert.equal(translate('Raise to','zh'),'加注至');
  assert.equal(translate('Waiting for players to start... ({count} joined)','zh',{count:3}),'等待玩家开始游戏…（已有 3 人加入）');
  assert.equal(translate('Hand #{number}','en',{number:4}),'Hand #4');
  assert.equal(formatPlayerName('Bot 2',true,'zh'),'电脑 2');
  assert.equal(formatPlayerName('You',false,'zh'),'You');
  assert.equal(formatPlayerName('Bot 2',false,'zh'),'Bot 2');
  assert.equal(translate('Unknown server text','zh'),'Unknown server text');
});

test('preference survives fresh module loading and blocked/invalid storage is safe',()=>{
  const saved={getItem:()=> 'zh'};assert.equal(readStoredLocale(saved),'zh');
  assert.equal(readStoredLocale({getItem:()=> 'invalid'}),'en');
  assert.equal(readStoredLocale({getItem:()=>{throw new Error('blocked');}}),'en');
  for(const locale of ['zh','en']){
    const result=spawnSync(process.execPath,['--input-type=module','-e',`globalThis.window={localStorage:{getItem:()=>${JSON.stringify(locale)}}}; const mod=await import('./.test-build/locale.mjs'); console.log(mod.getLocale());`],{encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),locale);
  }
});

test('accessible switch preserves settings form, modal, raise slider and active hand',()=>{
  state().initGame(settings);setLocale('en');
  let submitted:unknown;
  const root=mount(<><LanguageSwitcher/><GameSettings onStart={value=>{submitted=value;}}/><TutorialModal/><Controls onAction={()=>{}} toCall={20} minRaise={20} chips={2000} currentBet={0} bigBlind={20}/></>);
  act(()=>button(root,'9-Max').props.onClick());
  act(()=>root.root.findAllByType('input').find(i=>i.props['aria-label']==='Big Blind Amount:')!.props.onChange({target:{value:'40'}}));
  act(()=>root.root.findAllByType('input').find(i=>i.props['aria-label']==='Raise amount')!.props.onChange({target:{value:'180'}}));
  const before=JSON.stringify(state()),gameStorage=memory.get('texas-holdem-storage');
  language(root,'zh');
  assert.equal(JSON.stringify(state()),before);assert.equal(memory.get('texas-holdem-storage'),gameStorage);
  assert.equal(getLocale(),'zh');assert.equal(memory.get(LOCALE_KEY),'zh');assert.equal(document.documentElement.lang,'zh-CN');assert.equal(document.title,'扑克练习');
  assert.match(visible(root),/牌桌设置/);assert.match(visible(root),/德州扑克指南/);
  assert.equal(root.root.findAllByType('input').find(i=>i.props['aria-label']==='加注总额')!.props.value,180);
  assert.equal(root.root.findAllByType('button').find(b=>b.props.lang==='zh-CN')!.props['aria-pressed'],true);
  act(()=>root.root.findByType('form').props.onSubmit({preventDefault(){}}));
  assert.deepEqual(submitted,{...settings,playerCount:9,bigBlind:40,startingChips:4000});
  language(root,'en');assert.equal(JSON.stringify(state()),before);assert.match(visible(root),/Texas Hold'em Guide/);
  close(root);
});

test('multiplayer validation errors and entered fields retranslate without lost input',()=>{
  setLocale('en');const root=mount(<><LanguageSwitcher/><MultiplayerPage/></>);
  act(()=>{void button(root,'Join').props.onClick();});assert.match(visible(root),/Please enter a username/);
  act(()=>root.root.findAllByType('input').find(i=>i.props['aria-label']==='Username')!.props.onChange({target:{value:'You'}}));
  act(()=>root.root.findAllByType('input').find(i=>i.props['aria-label']==='Room ID')!.props.onChange({target:{value:'ab12'}}));
  language(root,'zh');assert.match(visible(root),/请输入用户名/);
  assert.equal(root.root.findAllByType('input').find(i=>i.props['aria-label']==='用户名')!.props.value,'You');
  assert.equal(root.root.findAllByType('input').find(i=>i.props['aria-label']==='房间号')!.props.value,'AB12');
  language(root,'en');assert.match(visible(root),/Please enter a username/);
  close(root);assert.equal(state().mode,'single');
});

test('multiplayer create/join/socket/waiting flow preserves protocol across language changes',async()=>{
  const calls:{url:string;init:unknown}[]=[];const sockets:any[]=[];
  (globalThis as any).fetch=async(url:string,init:unknown)=>{calls.push({url,init});return {ok:true,json:async()=>url.includes('/create')?{room_id:'ABCD'}:{player_id:'user-1'}};};
  (globalThis as any).WebSocket=class {url:string;onopen:any;onmessage:any;onclose:any;sent:string[]=[];constructor(url:string){this.url=url;sockets.push(this);}send(value:string){this.sent.push(value);}close(){}};
  setLocale('en');const root=mount(<><LanguageSwitcher/><MultiplayerPage/></>);
  act(()=>root.root.findAllByType('input').find(i=>i.props['aria-label']==='Username')!.props.onChange({target:{value:'You'}}));
  await act(async()=>{await button(root,'Create New Room').props.onClick();});
  assert.equal(calls[0].url,'http://localhost:8000/api/rooms/create');
  assert.equal(calls[1].url,'http://localhost:8000/api/rooms/join?room_id=ABCD&username=You');
  assert.equal(sockets[0].url,'ws://localhost:8000/ws/ABCD/user-1');
  const serverPlayer={id:'user-1',name:'You',chips:2000,position:0,is_active:true,is_all_in:false,current_bet:0,total_bet:0,action:null,hole_cards:[]};
  act(()=>{sockets[0].onopen();sockets[0].onmessage({data:JSON.stringify({type:'state',data:{room_id:'ABCD',pot:0,current_bet:0,dealer_position:0,current_turn:-1,stage:'waiting',small_blind:10,big_blind:20,min_raise:20,community_cards:[],players:[serverPlayer,{...serverPlayer,id:'user-2',name:'Bot 2',position:1}],winners:[]}})});});
  const before=JSON.stringify(state());language(root,'zh');
  assert.equal(JSON.stringify(state()),before);assert.equal(calls.length,2);assert.equal(sockets.length,1);
  assert.match(visible(root),/已有 2 人加入/);assert.match(visible(root),/You/);assert.match(visible(root),/Bot 2/);
  act(()=>button(root,'开始游戏').props.onClick());assert.deepEqual(sockets[0].sent,['{"type":"start"}']);
  act(()=>sockets[0].onclose());assert.match(visible(root),/连接已断开/);
  language(root,'en');assert.match(visible(root),/Connection lost/);close(root);
  (globalThis as any).fetch=()=>{throw new Error('Unexpected network request in test');};
});

test('real hand completion, chip conservation and replay state persist through language switches',()=>{
  state().initGame(settings);state().setTutorialSeen(true);
  let actions=0;
  while(state().stage!=='showdown'&&actions<100){const st=state(),p=st.players[st.currentTurn];if(!p||st.currentTurn===-1)st.nextStage();else st.playerAction(st.currentBet>p.currentBet?'call':'check');actions++;}
  assert.equal(state().stage,'showdown');assert.equal(state().players.reduce((sum,p)=>sum+p.chips,0),12000);
  const hand=state().sessions[state().currentSessionId].hands[0];assert.ok(hand.history.length>=20);assert.ok(hand.history.every(h=>h.snapshot));
  state().startReplay(hand.id);state().nextReplayStep();setLocale('en');
  const root=mount(<><LanguageSwitcher/><Table/><SessionStats/></>);
  act(()=>button(root,'INFO').props.onClick());
  // Both the standalone and open panel stats use the real stored hand history.
  const before=JSON.stringify(state());language(root,'zh');assert.equal(JSON.stringify(state()),before);
  assert.match(visible(root),/回放模式/);assert.match(visible(root),/下一步/);assert.match(visible(root),/第 1 手/);
  act(()=>button(root,'筹码排行').props.onClick());language(root,'en');assert.match(visible(root),/LEADERBOARD/);
  assert.equal(state().replayState.currentStep,1);assert.equal(state().replayState.isPlaying,false);
  act(()=>state().prevReplayStep());assert.equal(state().replayState.currentStep,0);
  act(()=>{for(let i=0;i<hand.history.length+2;i++)state().nextReplayStep();});assert.equal(state().replayState.currentStep,hand.history.length-1);
  act(()=>state().stopReplay());assert.equal(state().replayState.isActive,false);close(root);
  state().startNewHand();assert.equal(state().stage,'preflop');assert.equal(state().sessions[state().currentSessionId].hands.length,1);
});

test('probability effect and current hand retranslate while numeric results stay intact',async()=>{
  const hero:Card[]=[{suit:'hearts',rank:14},{suit:'hearts',rank:13}],board:Card[]=[{suit:'hearts',rank:12},{suit:'hearts',rank:11},{suit:'hearts',rank:10},{suit:'clubs',rank:2},{suit:'spades',rank:3}];
  assert.equal(evaluateHand(hero,board).name,'Royal Flush');assert.deepEqual(calculateEquity(hero,board,5,1000),{winRate:100,tieRate:0});
  setLocale('en');const root=mount(<><LanguageSwitcher/><ProbabilityCalculator heroCards={hero} communityCards={board} activeOpponentsCount={5}/></>);
  await act(async()=>{await new Promise(resolve=>setTimeout(resolve,30));});assert.match(visible(root),/100\.0/);assert.match(visible(root),/Royal Flush/);
  language(root,'zh');assert.match(visible(root),/皇家同花顺/);assert.match(visible(root),/100\.0/);assert.match(visible(root),/平局率/);
  assert.ok(['check','call','raise','fold','all-in'].includes(getAiAction(state().players[1],state()).action));close(root);
});
