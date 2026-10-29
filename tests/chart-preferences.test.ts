import test from 'node:test';
import assert from 'node:assert/strict';
import { parseChartPreferences, defaultChartPreferences, allocationChartData, timeChartSummary } from '../src/chartPreferences.ts';
test('preferências antigas, desconhecidas e corrompidas voltam ao padrão sem tocar no banco de estudo',()=>{
 for(const raw of [null,'{','null','[]','{"version":2,"time":"line"}'])assert.deepEqual(parseChartPreferences(raw),defaultChartPreferences);
 assert.deepEqual(parseChartPreferences('{"version":1,"time":"line","allocation":"invalid"}'),{version:1,time:'line',allocation:'pie'});
});
test('preferências válidas sobrevivem à serialização sem intercambiar tipos de gráfico',()=>{
 for(const time of ['bar','line','area'])for(const allocation of ['pie','bar','stacked']){const p={version:1,time,allocation};assert.deepEqual(parseChartPreferences(JSON.stringify(p)),p);}
 assert.equal(parseChartPreferences('{"version":1,"time":"pie","allocation":"line"}').time,'area');
});
test('distribuição inclui a reserva e mantém percentuais e minutos consistentes',()=>{
 const data=[{id:'a',name:'Português',color:'#777',target:120},{id:'b',name:'Matemática',color:'#999',target:60}],before=JSON.stringify(data),r=allocationChartData(data,300);
 assert.equal(r.free,120);assert.equal(r.over,0);assert.ok(Math.abs(r.rows.reduce((n,s)=>n+s.percent,0)-100)<1e-9);assert.equal(r.rows.reduce((n,s)=>n+s.minutes,0),300);assert.equal(JSON.stringify(data),before);
});
test('horas excedentes usam o total de metas sem fingir que cabem na disponibilidade',()=>{
 const r=allocationChartData([{id:'a',name:'A',color:'#777',target:400},{id:'b',name:'B',color:'#999',target:200}],300);
 assert.equal(r.denominator,600);assert.equal(r.over,300);assert.equal(r.free,0);assert.ok(Math.abs(r.rows.reduce((n,s)=>n+s.percent,0)-100)<1e-9);
});
test('matéria zerada continua na lista e base vazia não gera NaN nem fatia fictícia',()=>{
 const zero=allocationChartData([{id:'a',name:'A',color:'#777',target:0}],0);assert.equal(zero.rows[0].percent,0);assert.equal(zero.rows[0].minutes,0);assert.equal(zero.denominator,0);
 assert.deepEqual(allocationChartData([],0).rows,[]);const reserve=allocationChartData([],60);assert.equal(reserve.rows[0].name,'Tempo livre / reserva');assert.equal(reserve.rows[0].percent,100);
});
test('resumo semanal mantém tempo estudado acima da disponibilidade e distingue vazio de zero estudo',()=>{
 assert.deepEqual(timeChartSummary([{dia:'Seg',horas:3,meta:1},{dia:'Ter',horas:0,meta:1}]),{studied:3,available:2,empty:false});
 assert.equal(timeChartSummary([{dia:'Seg',horas:0,meta:1}]).empty,false);assert.equal(timeChartSummary([]).empty,true);
});
