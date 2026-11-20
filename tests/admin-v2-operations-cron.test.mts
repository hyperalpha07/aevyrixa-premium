import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { timingSafeEqual } from "node:crypto";
import test from "node:test";
import ts from "typescript";

const source=readFileSync(new URL("../app/api/cron/admin-v2-automation/route.ts",import.meta.url),"utf8");
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function loadCron(mocks:{
 listScheduledTaskAutomationRules:()=>Promise<unknown[]>;
 runTaskAutomationRule:(id:string,actor:string,mode:string)=>Promise<unknown>;
}){
 const output:Record<string,any>={};
 new Function("require","exports",compiled)((name:string)=>{
  if(name==="node:crypto")return {timingSafeEqual};
  if(name==="@/lib/admin-v2/operations-store")return mocks;
  throw new Error("Unexpected import "+name);
 },output);
 return output.GET as (request:Request)=>Promise<Response>;
}
const request=(token?:string)=>new Request("https://example.org/api/cron/admin-v2-automation",{
 headers:token?{authorization:`Bearer ${token}`}:{},
});
test("cron fails closed without configured secret or with invalid authorization",async()=>{
 const previous=process.env.CRON_SECRET;
 try{
  let touched=false;
  const GET=loadCron({
   listScheduledTaskAutomationRules:async()=>{touched=true;return [];},
   runTaskAutomationRule:async()=>{touched=true;return {};},
  });
  delete process.env.CRON_SECRET;
  assert.equal((await GET(request())).status,503);
  process.env.CRON_SECRET="a".repeat(48);
  assert.equal((await GET(request("wrong"))).status,401);
  assert.equal(touched,false);
 } finally {
  if(previous===undefined)delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET=previous;
 }
});
test("authorized cron runs only stored daily rules and caps batch",async()=>{
 const previous=process.env.CRON_SECRET;
 try{
  const secret="b".repeat(48);
  process.env.CRON_SECRET=secret;
  let calls=0;
  const GET=loadCron({
   listScheduledTaskAutomationRules:async()=>[{id:"one"},{id:"two"}],
   runTaskAutomationRule:async(id,actor,mode)=>{
    assert.equal(actor,"system-daily-automation");
    assert.equal(mode,"scheduled");
    calls++;
    return {reused:id==="two"};
   },
  });
  const response=await GET(request(secret));
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{status:"completed",scheduledRules:2,created:1,reused:1,failed:0});
  assert.equal(calls,2);

  const limited=loadCron({
   listScheduledTaskAutomationRules:async()=>Array.from({length:26},(_,i)=>({id:String(i)})),
   runTaskAutomationRule:async()=>{throw new Error("must not execute");},
  });
  assert.equal((await limited(request(secret))).status,503);
 }finally{
  if(previous===undefined)delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET=previous;
 }
});
