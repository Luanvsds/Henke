const inputs=[...document.querySelectorAll('[data-rate]')],brl=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function calculate(){let total=0,count=0;
const qty=inputs.map(i=>Math.min(999,Math.max(0,Math.floor(Number(i.value)||0)))) ;
inputs.forEach((i,j)=>{total+=Math.round(Number(i.dataset.rate)*100)*qty[j];count+=qty[j]});
total/=100;
document.querySelector('#monthly').innerHTML=brl(total)+' <small>/ mês</small>';
document.querySelector('#yearly').textContent=count?`${count} aparelho${count>1?'s':''} · 12 mensalidades · ${brl(total*12)} no ano`:'Selecione a quantidade de equipamentos.';
document.querySelector('#business').textContent=count>=10?'Sua empresa tem 10 ou mais aparelhos. Nossa equipe pode avaliar a estrutura e preparar uma proposta.':'';
document.querySelector('#request-plan').href='https://wa.me/5548984283783?text='+encodeURIComponent(`Olá! Gostaria de conversar sobre o plano anual de higienização. Aparelhos: ${qty[0]} de 9–18 mil BTU, ${qty[1]} de 22–30 mil BTU e ${qty[2]} de 36–60 mil BTU. Simulação: ${brl(total)}/mês em 12 mensalidades, ${brl(total*12)}/ano. Aguardo a confirmação das condições.`)}inputs.forEach(i=>{i.addEventListener('input',calculate);i.addEventListener('change',()=>{i.value=Math.min(999,Math.max(0,Math.floor(Number(i.value)||0)));calculate()})});
document.querySelectorAll('[data-plan]').forEach(a=>a.addEventListener('click',()=>{document.querySelector('#simulador').open=true;inputs[Number(a.dataset.plan)].value=Math.max(1,Number(inputs[Number(a.dataset.plan)].value));calculate()}));
document.querySelectorAll('[data-service]').forEach(a=>{a.href='https://wa.me/5548984283783?text='+encodeURIComponent('Olá! Gostaria de conversar sobre '+a.dataset.service.toLowerCase()+'.');a.target='_blank';a.rel='noopener'});


calculate();
