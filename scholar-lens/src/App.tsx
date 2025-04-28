import type React from 'react';
import { useState } from 'react';
import emailjs from 'emailjs-com';

const genders = ["Male", "Female", "Other"] as const;
const actOpts = ["Yes", "No"] as const;
const subj = ["Math","Geography","Biology","Chemistry","Physics","English","Second Language"];

function academicDecline({scores, studyHrs, absences, activities}: {
  scores: number[], studyHrs: number, absences: number, activities: string
}) {
  // Simple rule: if average<60 or some subject < 50, absences > 10, studyHrs < 5, no activities
  const avg = scores.reduce((a,b)=>a+b,0)/scores.length;
  if (
    avg < 60 ||
    scores.some(v => v < 50) ||
    absences > 10 ||
    studyHrs < 5 ||
    activities === "No"
  ) return true;
  return false;
}

function getSuggestions({scores, studyHrs}:{scores:number[], studyHrs:number}) {
  const low = subj.filter((_,i)=>scores[i]<60);
  const moreHours = studyHrs<10 ? 10-studyHrs : 0;
  return {
    lowSubjects: low,
    studyHrsSuggestion: moreHours>0 ? moreHours : null
  };
}

function parentEmailHtml({studentName, lowSubjects, studyHrsSuggestion}:{studentName:string,lowSubjects:string[],studyHrsSuggestion:number|null}) {
  return `<div style='font-family:sans-serif;color:#163971;'>
    <h2>Academic Alert – ${studentName}</h2>
    <p>Your child is at risk of academic decline based on recent school records in SCHOLAR LENS.</p>
    <ul>
      ${lowSubjects.length>0?`<li>Needs improvement in: <b>${lowSubjects.join(', ')}</b></li>`:''}
      ${studyHrsSuggestion?`<li>Should increase their weekly study hours by at least <b>${studyHrsSuggestion} hours</b>.</li>`:''}
    </ul>
    <p>Please discuss these points and help plan improvements. <br/>Thank you.<br/><i>- SCHOLAR LENS Academic Team</i></p>
  </div>`;
}

function ScholarLensApp() {
  // Simple in-memory user state
  const [screen, setScreen] = useState<'login'|'register'|'main'>('login');
  const [registerInfo,setRegisterInfo] = useState({name:'', email:'', pass:'', pass2:''});
  const [users, setUsers] = useState<{email:string; name:string; pass:string;}[]>([]);
  const [loginInfo,setLoginInfo] = useState({email:'', pass:''});
  const [curUser, setCurUser] = useState<{email:string, name:string}|null>(null);

  // Form State
  const [form, setForm] = useState({
    name: '', gender: '', absences: '', studyHrs: '', activities: '',
    parentEmail: '',
    scores: Array(subj.length).fill('') as string[]
  });
  const [submitted, setSubmitted] = useState(false);
  const [decline, setDecline] = useState(false);
  const [parentHtml, setParentHtml] = useState('');
  const [suggest, setSuggest] = useState<{lowSubjects:string[],studyHrsSuggestion:number|null}|null>(null);
  const [copied, setCopied] = useState(false);

  // EmailJS config (hardcoded service, inputs for others)
  const [emailjsSetup, setEmailjsSetup] = useState({
    service: 'service_qud8l6l',
    template: '',
    user: ''
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendErr, setSendErr] = useState('');

  // Auth logic
  function doRegister(e:React.FormEvent) {
    e.preventDefault();
    if (registerInfo.pass!==registerInfo.pass2) return alert('Passwords must match');
    if (!registerInfo.name||!registerInfo.email||!registerInfo.pass) return;
    setUsers(u=>[...u,{email:registerInfo.email.toLowerCase(), name: registerInfo.name, pass:registerInfo.pass}]);
    setScreen('login');
  }
  function doLogin(e:React.FormEvent) {
    e.preventDefault();
    const found = users.find(u=>u.email===loginInfo.email.toLowerCase()&&u.pass===loginInfo.pass);
    if (!found) return alert('Invalid credentials');
    setCurUser({email:found.email, name:found.name});
    setForm(f=>({...f,name:found.name}));
    setScreen('main');
  }

  // Main form logic
  function handleChange(e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>, idx?:number) {
    const {name,value} = e.target;
    if (typeof idx==='number') {
      setForm(f=>{
        const scores = f.scores.slice();
        scores[idx]=value;
        return {...f,scores};
      });
    } else {
      setForm(f=>({...f,[name]:value}));
    }
  }

  function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setSent(false);
    setSendErr('');
    // check for academic decline
    const numScores = form.scores.map(s=>Number.parseInt(s)||0);
    const declineResult = academicDecline({
      scores:numScores,
      studyHrs: Number.parseInt(form.studyHrs)||0,
      absences: Number.parseInt(form.absences)||0,
      activities: form.activities
    });
    setDecline(declineResult);
    if (declineResult) {
      const suggestion = getSuggestions({scores:numScores, studyHrs: Number.parseInt(form.studyHrs)||0});
      setSuggest(suggestion);
      setParentHtml(parentEmailHtml({studentName:form.name||curUser?.name||'the student', ...suggestion}));
    } else {
      setSuggest(null);
      setParentHtml('');
    }
  }

  // Theme colors
  const mainBlue = '#19418E', lightBg = '#F6FAFF';
  const logo = <span style={{fontWeight:900, fontSize:34, color:mainBlue, letterSpacing:2}}>SCHOLAR <span style={{color:'#FFB800'}}>LENS</span></span>;

  // Ui
  return <div style={{minHeight:'100vh',background:lightBg,padding:0,fontFamily:'serif'}}>
    <div style={{width:'100%',display:'flex',alignItems:'center',gap:16,padding:'32px 0 12px 0',justifyContent:'center'}}>
      <svg width="38" height="38" style={{color:mainBlue}} fill="currentColor" viewBox="0 0 24 24"><path d="M12.004 1.999a6.5 6.5 0 016.197 8.561C22.185 10.944 23.273 13.426 24 15.407c-1.625-2.058-3.917-4.263-5.338-5.779a8.5 8.5 0 11-9.324.01C3.916 11.132 1.624 13.336 0 15.393c.73-1.976 1.823-4.462 5.803-4.855A6.503 6.503 0 0112.004 2zm0 2a4.5 4.5 0 100 9 4.5 4.5 0 000-9z"></path></svg>
      {logo}
    </div>
    <div style={{width:'100%',display:'flex',justifyContent:'center'}}>
      <div style={{background:'#fff',boxShadow:'0 2px 24px #19307b11',borderRadius:20,padding:32,minWidth:350,maxWidth:440}}>
        {screen==='login'&&<>
          <h3 style={{fontWeight:800,fontSize:22,marginBottom:0,color:mainBlue}}>Sign In</h3>
          <form onSubmit={doLogin} style={{marginTop:18,display:'flex',flexDirection:'column',gap:18}}>
            <input name="email" placeholder="Email" autoFocus autoComplete="username" required value={loginInfo.email} onChange={e=>setLoginInfo(l=>({...l,email:e.target.value}))} className="border px-3 py-2 rounded"/>
            <input name="pass" placeholder="Password" type="password" autoComplete="current-password" required value={loginInfo.pass} onChange={e=>setLoginInfo(l=>({...l,pass:e.target.value}))} className="border px-3 py-2 rounded"/>
            <button className="bg-blue-700 text-white py-2 rounded font-semibold" type="submit">Login</button>
          </form>
          <div style={{fontSize:14,marginTop:14}}>No account? <button className="underline text-blue-700" style={{background:'none',border:'none'}} onClick={()=>setScreen('register')}>Register here</button></div>
        </>}
        {screen==='register'&&<>
          <h3 style={{fontWeight:800,fontSize:22,marginBottom:0,color:mainBlue}}>Create Account</h3>
          <form onSubmit={doRegister} style={{marginTop:18,display:'flex',flexDirection:'column',gap:15}}>
            <input name="name" placeholder="Full Name" required value={registerInfo.name} onChange={e=>setRegisterInfo(r=>({...r, name:e.target.value}))} className="border px-3 py-2 rounded"/>
            <input name="email" placeholder="Email" required value={registerInfo.email} onChange={e=>setRegisterInfo(r=>({...r, email:e.target.value}))} className="border px-3 py-2 rounded"/>
            <input name="pass" placeholder="Password" type="password" autoComplete="new-password" required value={registerInfo.pass} onChange={e=>setRegisterInfo(r=>({...r, pass:e.target.value}))} className="border px-3 py-2 rounded"/>
            <input name="pass2" placeholder="Repeat Password" type="password" required value={registerInfo.pass2} onChange={e=>setRegisterInfo(r=>({...r, pass2:e.target.value}))} className="border px-3 py-2 rounded"/>
            <button className="bg-blue-700 text-white py-2 rounded font-semibold" type="submit">Register</button>
          </form>
          <div style={{fontSize:14,marginTop:12}}>Already have an account? <button className="underline text-blue-700" style={{background:'none',border:'none'}} onClick={()=>setScreen('login')}>Login here</button></div>
        </>}
        {screen==='main'&&<>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <h3 style={{fontWeight:800,fontSize:22,margin:'0 0 12px',color:mainBlue}}>Academic Report</h3>
            <button style={{background:'none',color:mainBlue,fontWeight:'bold',fontSize:14}} onClick={()=>{setCurUser(null);setScreen('login')}}>Logout</button>
          </div>
          <form onSubmit={submitForm} style={{display:'flex',flexDirection:'column',gap:16}}>
            <input type="text" name="name" required value={form.name} onChange={handleChange} placeholder="Full Name" className="border px-3 py-2 rounded" />
            <select name="gender" required value={form.gender} onChange={handleChange} className="border px-3 py-2 rounded">
              <option value="">Gender</option>
              {genders.map(opt=><option key={opt}>{opt}</option>)}
            </select>
            <input type="number" name="absences" required value={form.absences} onChange={handleChange} placeholder="Absence days" className="border px-3 py-2 rounded" min={0}/>
            <input type="number" name="studyHrs" required value={form.studyHrs} onChange={handleChange} placeholder="Weekly self-study hours" className="border px-3 py-2 rounded" min={0}/>
            <select name="activities" required value={form.activities} onChange={handleChange} className="border px-3 py-2 rounded">
              <option value="">Curricular Activities?</option>
              {actOpts.map(opt=><option key={opt}>{opt}</option>)}
            </select>
            {subj.map((s,idx)=>(
              <input key={s} required type="number" min={0} max={100} placeholder={s+" Score"} className="border px-3 py-2 rounded" value={form.scores[idx]} onChange={e=>handleChange(e,idx)} />
            ))}
            <input type="email" name="parentEmail" required value={form.parentEmail} onChange={handleChange} placeholder="Parent Email" className="border px-3 py-2 rounded" />
            <button className="bg-blue-700 text-white py-2 rounded font-semibold" type="submit">Check Academic Status</button>
          </form>
          {submitted && (
            <div style={{marginTop:26,background:'#E4F0FF',borderRadius:8,padding:20}}>
              <h4 style={{color:decline?'#d8000c':mainBlue}}>
                {decline?"⚠️ Academic Decline Alert":"✅ No Academic Decline Detected"}
              </h4>
              {decline && suggest && <>
                <ul className="list-disc pl-6 mt-2">
                  {suggest.lowSubjects.length>0&&<li>Focus more on: <b>{suggest.lowSubjects.join(', ')}</b>.</li>}
                  {suggest.studyHrsSuggestion&&<li>Increase weekly self-study hours by at least <b>{suggest.studyHrsSuggestion}</b> hours.</li>}
                  <li>Revise class notes regularly and ask teachers for extra help in weak subjects.</li>
                  <li>Reduce absence days if possible and participate in school activities.</li>
                </ul>
                <div style={{marginTop:22,background:'#FFF7E4',borderRadius:6,padding:18}}>
                  <b>Parent Alert Email Preview:</b>
                  <div dangerouslySetInnerHTML={{__html:parentHtml}} style={{marginTop:10,fontSize:15,border:'1px dashed #bbb',padding:10,background:'#fff'}}></div>
                  <button className="mt-3 bg-yellow-400 py-1 px-3 rounded font-semibold text-blue-900" onClick={()=>{
                    navigator.clipboard.writeText(parentHtml);
                    setCopied(true);
                    setTimeout(()=>setCopied(false),2000);
                  }} style={{marginTop:10}}>{copied?'Copied!':'Copy Email HTML'}</button>
                  <div style={{marginTop:22}}>
                    {/* ----------- EmailJS Section ----------- */}
                    <b style={{fontSize:14}}>Send directly by email to parent:</b>
                    <div style={{margin:'10px 0',display:'flex',flexDirection:'column',gap:6,fontSize:12,maxWidth:340}}>
                      {/* Service ID is hardcoded, just show the rest */}
                      <input type="hidden" value="service_qud8l6l" />
                      <input placeholder="EmailJS Template ID" value={emailjsSetup.template} onChange={e=>setEmailjsSetup(s=>({...s,template:e.target.value}))} className="border px-2 py-1 rounded"/>
                      <input placeholder="EmailJS Public Key" value={emailjsSetup.user} onChange={e=>setEmailjsSetup(s=>({...s,user:e.target.value}))} className="border px-2 py-1 rounded"/>
                    </div>
                    <button onClick={async()=>{
                      setSending(true); setSent(false); setSendErr('');
                      try {
                        await emailjs.send('service_qud8l6l', emailjsSetup.template, {
                          to_email: form.parentEmail,
                          to_name: form.name,
                          message_html: parentHtml,
                        }, emailjsSetup.user);
                        setSent(true);
                        setSendErr('');
                      } catch (err:any) {
                        setSendErr('Sending failed. Double check EmailJS config and try again.');
                        setSent(false);
                      } finally { setSending(false); }
                    }}
                    className="bg-blue-700 text-white rounded px-4 py-2 mt-2 font-semibold disabled:opacity-60" style={{width:'100%',maxWidth:220,pointerEvents:sending?'none':'auto'}} disabled={sending||!emailjsSetup.template||!emailjsSetup.user}>
                      {sending?'Sending...': sent?'Sent!':'Send Email to Parent'}
                    </button>
                    <div style={{fontSize:13,color:sent?'#249926':'#d8000c',marginTop:8}}>{sent?"Email sent!":sendErr}</div>
                    <div style={{fontSize:12,color:'#555',marginTop:8}}>
                      <b>Setup:</b> <span>Enter your EmailJS Template ID and Public Key above. Template must use variables: <i>to_email</i>, <i>to_name</i>, <i>message_html</i>. Set the email body to use <b>message_html</b> as HTML.</span>
                    </div>
                  </div>
                </div>
              </>}
              {!decline && <p style={{marginTop:12}}>Keep up the good efforts and maintain a healthy study routine!</p>}
            </div>
          )}
        </>}
      </div>
    </div>
    <div style={{textAlign:'center',marginTop:44,color:'#aaa',fontSize:13}}>&copy; {new Date().getFullYear()} Scholar Lens | For demo/school use</div>
  </div>;
}

export default ScholarLensApp;
