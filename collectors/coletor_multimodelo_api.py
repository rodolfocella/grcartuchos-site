# include conexao
# Este código utiliza include conexao para banco de dados

import time
import json
import os
import sys
import logging
import urllib.request
import requests
from bs4 import BeautifulSoup
import re
import ctypes
import urllib3
from requests.auth import HTTPDigestAuth, HTTPBasicAuth
from playwright.sync_api import sync_playwright
from pathlib import Path


if getattr(sys, "frozen", False) and sys.platform == "darwin":
    BASE_DIR = Path.home() / "Library" / "Application Support" / "GRColetor"
    BASE_DIR.mkdir(parents=True, exist_ok=True)
else:
    BASE_DIR = Path(sys.executable if getattr(sys, "frozen", False) else __file__).resolve().parent
os.chdir(BASE_DIR)

# Aplicativos --noconsole não possuem stdout/stderr. Direcioná-los ao descarte
# evita falhas em prints e em bibliotecas que esperam esses objetos.
if sys.stdout is None:
    sys.stdout = open(os.devnull, "w")
if sys.stderr is None:
    sys.stderr = open(os.devnull, "w")

# Desativa avisos de segurança SSL
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# --- SENHA PADRÃO DA BROTHER NOVA ---
SENHA_BROTHER_5652 = "initpass"
# -----------------------------------

API_URL = "https://api.grcartuchos.com.br/contador"

# --- CONFIGURAÇÃO DE LOGS ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.FileHandler("log_geral.txt", encoding='utf-8'), logging.StreamHandler()]
)

def ocultar_janela():
    """Comando do Windows para esconder a tela preta do CMD"""
    try:
        janela = ctypes.windll.kernel32.GetConsoleWindow()
        if janela:
            ctypes.windll.user32.ShowWindow(janela, 0)
    except Exception:
        pass

def solicitar_configuracao(config_existente=None):
    """Mostra o assistente gráfico compatível com executáveis sem console."""
    import tkinter as tk
    from tkinter import messagebox, simpledialog

    config = dict(config_existente or {})
    root = tk.Tk()
    root.withdraw()
    root.attributes('-topmost', True)

    try:
        if not config:
            modelos = (
                "1 - Brother Linha Antiga\n"
                "2 - Brother Linha Nova\n"
                "3 - Canon 1643\n"
                "4 - Ricoh\n"
                "5 - Brother 2540 / 2700 / 2520\n"
                "6 - Epson EcoTank\n"
                "7 - Canon GX6000 / GX Series"
            )
            config["TIPO"] = simpledialog.askstring(
                "Coletor GR Cartuchos", f"Escolha o tipo:\n\n{modelos}", parent=root
            )
            config["MODELO"] = simpledialog.askstring(
                "Coletor GR Cartuchos", "Modelo exato da impressora:", parent=root
            )
            config["IP"] = simpledialog.askstring(
                "Coletor GR Cartuchos", "IP local da impressora:", parent=root
            )
            config["CLIENTE"] = simpledialog.askstring(
                "Coletor GR Cartuchos", "Nome exato do cliente no painel:", parent=root
            )

        if not config.get("API_TOKEN"):
            config["API_TOKEN"] = simpledialog.askstring(
                "Coletor GR Cartuchos",
                "Token da API fornecido pela GR Cartuchos:",
                parent=root,
            )

        if config.get("TIPO") == "7" and not config.get("SENHA_CANON"):
            config["SENHA_CANON"] = simpledialog.askstring(
                "Coletor GR Cartuchos",
                "Senha de administrador da Canon:",
                parent=root,
                show="*",
            )
        else:
            config.setdefault("SENHA_CANON", "")

        obrigatorios = ("TIPO", "MODELO", "IP", "CLIENTE", "API_TOKEN")
        if any(not str(config.get(campo, "")).strip() for campo in obrigatorios):
            messagebox.showerror(
                "Coletor GR Cartuchos", "A configuração foi cancelada ou está incompleta."
            )
            raise RuntimeError("Configuração inicial incompleta")

        return config
    finally:
        root.destroy()

def carregar_ou_criar_config():
    arquivo_config = "config_coletor.json"
    if not os.path.exists(arquivo_config):
        config = solicitar_configuracao()
        
        with open(arquivo_config, "w") as f:
            json.dump(config, f, indent=4)
        
        return config, True 
    else:
        with open(arquivo_config, "r") as f:
            config = json.load(f)
        if not config.get("API_TOKEN"):
            config = solicitar_configuracao(config)
            with open(arquivo_config, "w") as f:
                json.dump(config, f, indent=4)
        ocultar_janela()
        return config, False

# --- MOTORES DE COLETA ---

def coletar_brother_8952(ip):
    url = f"http://{ip}/general/information.html?kind=item"
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            content = str(response.read())
        contador = "0"
        find_cont = '<dt>Page&#32;Counter</dt><dd>'
        if find_cont in content:
            pos_cont = int(content.index(find_cont) + len(find_cont))
            contador = content[pos_cont: pos_cont + 6].strip().replace('<', '')
        return contador, "0", "0"
    except Exception as e:
        logging.error(f"Erro Linha Antiga: {e}")
        return "0", "0", "0"

def coletar_brother_2540(ip):
    url = f"http://{ip}/general/status.html"
    try:
        res = requests.get(url, timeout=10)
        soup = BeautifulSoup(res.content, 'html.parser')
        texto = soup.get_text(separator=' ')
        match = re.search(r'(?:Page Counter|Contador de p[áa]ginas)[^\d]*(\d+)', texto, re.IGNORECASE)
        if match: return match.group(1), "0", "0"
        return "0", "0", "0"
    except Exception as e:
        logging.error(f"Erro Brother 2540: {e}")
        return "0", "0", "0"

def coletar_brother_5652(ip):
    url = f"http://{ip}/general/information.html?kind=item"
    session = requests.Session()
    session.headers.update({'User-Agent': 'Mozilla/5.0'})
    try:
        res = session.get(url, timeout=10)
        soup = BeautifulSoup(res.content, 'html.parser')
        form = soup.find('form')
        html = res.text
        if form:
            payload = {}
            for input_tag in form.find_all(['input', 'button']):
                nome = input_tag.get('name')
                if not nome: continue
                tipo = input_tag.get('type', '').lower()
                valor = input_tag.get('value', '')
                eh_campo_senha = False
                if input_tag.get('id') == 'LogBox' or tipo == 'password': eh_campo_senha = True
                elif re.match(r'^[a-zA-Z]\d{3,4}[a-zA-Z]$', nome): eh_campo_senha = True
                if eh_campo_senha: payload[nome] = SENHA_BROTHER_5652
                elif tipo in ['submit', 'button'] or nome.lower() == 'submit': payload[nome] = valor if valor else 'Submit'
                else: payload[nome] = valor
            headers = {'Referer': url}
            action = form.get('action')
            post_url = action if action and action.startswith('http') else f"http://{ip}/{action.lstrip('/')}" if action else url
            res_logado = session.post(post_url, data=payload, headers=headers, timeout=10)
            html = res_logado.text
            if "LogBox" in html or "Page&#32;Counter" not in html:
                res_logado = session.get(url, timeout=10)
                html = res_logado.text
        contador = "0"
        find_cont_8952 = '<dt>Page&#32;Counter</dt><dd>'
        if find_cont_8952 in html:
            pos_cont = int(html.index(find_cont_8952) + len(find_cont_8952))
            contador = html[pos_cont: pos_cont + 6].replace('<', '').replace('/', '').strip()
        else:
            texto_limpo = BeautifulSoup(html, 'html.parser').get_text(separator=' ')
            match_cont = re.search(r'(?:Page Counter|Contador de p[áa]ginas|Total)\s*(\d+)', texto_limpo, re.IGNORECASE)
            if match_cont: contador = match_cont.group(1)
        return contador, "0", "0"
    except Exception as e:
        logging.error(f"Erro Linha Nova: {e}")
        return "0", "0", "0"

def coletar_canon_1643(ip):
    session = requests.Session()
    session.verify = False 
    protocolos = ["http", "https"]
    
    for proto in protocolos:
        url_login_page = f"{proto}://{ip}/"
        url_login_submit = f"{proto}://{ip}/checkLogin.cgi"
        url_cont = f"{proto}://{ip}/d_counter.html"
        
        try:
            session.get(url_login_page, timeout=10)
            payload = {"i0012": "1", "i0014": "1643", "i0016": "1643", "submitButton": "Login"}
            session.post(url_login_submit, data=payload, timeout=10)
            res = session.get(url_cont, timeout=10)
            res.encoding = 'utf-8'
            soup = BeautifulSoup(res.text, 'html.parser')
            
            for row in soup.find_all('tr'):
                cells = row.find_all(['td', 'th'])
                for i, cell in enumerate(cells):
                    texto_celula = cell.get_text(strip=True)
                    if re.search(r'101:\s*Total\s*1', texto_celula, re.IGNORECASE):
                        if i + 1 < len(cells):
                            match = re.search(r'(\d+)', cells[i + 1].get_text(strip=True))
                            if match: return match.group(1), "0", "0"
        except Exception:
            continue
            
    logging.error(f"Erro Canon: Falha ao acessar ou achar contador no IP {ip}")
    return "0", "0", "0"

def coletar_canon_gx6000(ip, senha):
    """Motor automatizado via Playwright otimizado para Canon GX com senha dinâmica"""
    try:
        with sync_playwright() as p:
            # headless=True para rodar oculto em segundo plano (mude para False se quiser debugar visualmente)
            if sys.platform == "darwin":
                chrome_macos = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
                if not os.path.exists(chrome_macos):
                    raise RuntimeError("Google Chrome não está instalado neste Mac")
                browser = p.chromium.launch(
                    executable_path=chrome_macos, headless=True, slow_mo=100
                )
            else:
                browser = p.chromium.launch(headless=True, slow_mo=100)
            context = browser.new_context(
                ignore_https_errors=True,
                viewport={"width": 1400, "height": 900}
            )
            page = context.new_page()

            page.goto(f"https://{ip}/rui/index.html", wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(2000)

            try:
                if page.locator("#logonBtn").is_visible(timeout=2000):
                    page.locator("#logonBtn").click()
                    page.wait_for_timeout(1000)
            except:
                pass

            try:
                campo_senha = page.locator("input[type='password']").first
                campo_senha.wait_for(state="visible", timeout=5000)
                campo_senha.fill(senha)
                
                page.wait_for_timeout(500)
                botao_ok = page.get_by_text("OK", exact=True).first
                botao_ok.click()
            except Exception as e:
                logging.error(f"Erro ao preencher senha na Canon GX ({ip}): {e}")
                browser.close()
                return "0", "0", "0"

            page.wait_for_timeout(4000)

            try:
                menu_registros = page.get_by_text("Registros de uso").first
                menu_registros.click()
                page.wait_for_timeout(3000) 
            except Exception as e:
                logging.error(f"Erro ao clicar no menu 'Registros de uso' ({ip}): {e}")

            try:
                aba_total = page.get_by_text("Total folhas usadas no disp.").first
                aba_total.click()
                page.wait_for_timeout(3000)
            except Exception as e:
                logging.error(f"Erro ao expandir 'Total folhas usadas no disp.' ({ip}): {e}")

            html = page.content()
            soup = BeautifulSoup(html, "html.parser")
            texto_limpo = soup.get_text(separator=" ", strip=True)
            texto_limpo = re.sub(r"\s+", " ", texto_limpo)
            
            total, pb, cor = "0", "0", "0"

            padrao_total = r"N[º°]?\s*total\s+de\s+folhas\s+usadas\s*([\d.,]+)"
            padrao_pb = r"N[º°]?\s*folhas\s+sa[íi]da\s+preto/branco\s*([\d.,]+)"
            padrao_cor = r"N[º°]?\s*folhas\s+de\s+sa[íi]da\s+coloridas\s*([\d.,]+)"
            
            m_total = re.search(padrao_total, texto_limpo, re.IGNORECASE)
            m_pb = re.search(padrao_pb, texto_limpo, re.IGNORECASE)
            m_cor = re.search(padrao_cor, texto_limpo, re.IGNORECASE)

            if m_total: total = re.sub(r"[.,]", "", m_total.group(1))
            if m_pb: pb = re.sub(r"[.,]", "", m_pb.group(1))
            if m_cor: cor = re.sub(r"[.,]", "", m_cor.group(1))

            browser.close()
            return total, pb, cor
    except Exception as e:
        logging.error(f"Erro Canon GX6000 ({ip}): {e}")
        return "0", "0", "0"

def coletar_ricoh(ip):
    session = requests.Session()
    session.verify = False 
    rotas = [
        f"http://{ip}/web/guest/pt/websys/status/getUnificationCounter.cgi",
        f"http://{ip}/web/guest/en/websys/status/getUnificationCounter.cgi",
        f"http://{ip}/counter.asp", 
        f"http://{ip}/"
    ]
    for url in rotas:
        try:
            res = session.get(url, timeout=8)
            soup = BeautifulSoup(res.content, 'html.parser')
            texto_limpo = soup.get_text(separator=' ')
            
            match = re.search(r'(?:Page Total|Contador Total|Total Counter)[^\d]*(\d+)', texto_limpo, re.IGNORECASE)
            if not match:
                match = re.search(r'(?:Total)[^\d]*(\d+)', texto_limpo, re.IGNORECASE)

            if match: return match.group(1), "0", "0"
        except Exception: 
            continue
    return "0", "0", "0"

def coletar_epson(ip):
    session = requests.Session()
    session.verify = False 
    
    protocolos = ["http", "https"]
    caminhos = [
        "/PRESENTATION/ADVANCED/INFO_PRTINFO/TOP",   
        "/PRESENTATION/ADVANCED/INFO_MENTINFO/TOP",  
        "/PRESENTATION/ADVANCED/COMMON/TOP"
    ]
    
    for proto in protocolos:
        for caminho in caminhos:
            url = f"{proto}://{ip}{caminho}"
            try:
                headers = {"User-Agent": "Mozilla/5.0"}
                res = session.get(url, headers=headers, timeout=8)
                res.encoding = 'utf-8'
                soup = BeautifulSoup(res.text, 'html.parser')
                
                texto_limpo = soup.get_text(separator=' ')
                total, pb, cor = "0", "0", "0"
                
                match_total = re.search(r'N[úu]mero total de p[áa]ginas\s*:\s*(\d+)', texto_limpo, re.IGNORECASE)
                match_pb = re.search(r'N[úu]mero total de p[áa]ginas a P&B\s*:\s*(\d+)', texto_limpo, re.IGNORECASE)
                match_cor = re.search(r'N[úu]mero total de p[áa]ginas a Cor\s*:\s*(\d+)', texto_limpo, re.IGNORECASE)
                
                if match_total: total = match_total.group(1)
                if match_pb: pb = match_pb.group(1)
                if match_cor: cor = match_cor.group(1)
                
                if total == "0":
                    for dt in soup.find_all('dt'):
                        texto_chave = dt.get_text(strip=True).replace('\xa0', ' ')
                        dd = dt.find_next_sibling('dd')
                        if not dd: continue
                        valor = dd.get_text(strip=True)

                        if "Número total de páginas a P&B" in texto_chave: pb = valor
                        elif "Número total de páginas a Cor" in texto_chave: cor = valor
                        elif "Número total de páginas :" in texto_chave or "Número total de páginas:" in texto_chave: total = valor
                
                if total != "0":
                    return total, pb, cor
                    
            except Exception:
                continue
                
    logging.error(f"Erro Epson: Falha ao acessar ou achar contador no IP {ip}")
    return "0", "0", "0"

def enviar_contador(config, total, pb, cor):
    """Envia os contadores à VPS sem expor credenciais do MySQL."""
    token = config.get("API_TOKEN", "").strip()
    if not token:
        raise RuntimeError("Token da API não configurado")

    resposta = requests.post(
        API_URL,
        headers={"Authorization": f"Bearer {token}"},
        json={
            "cliente": config["CLIENTE"],
            "ip": config["IP"],
            "impressora": config["MODELO"],
            "cont": int(total),
            "preto": str(pb),
            "color": str(cor),
        },
        timeout=30,
    )
    if not resposta.ok:
        raise RuntimeError(
            f"API respondeu HTTP {resposta.status_code}: {resposta.text[:300]}"
        )


def executar_coleta(config):
    tipo = config['TIPO']
    ip = config['IP']
    
    if tipo == '1': return coletar_brother_8952(ip)
    elif tipo == '2': return coletar_brother_5652(ip)
    elif tipo == '3': return coletar_canon_1643(ip)
    elif tipo == '4': return coletar_ricoh(ip)
    elif tipo == '5': return coletar_brother_2540(ip)
    elif tipo == '6': return coletar_epson(ip)
    elif tipo == '7':
        senha = config.get('SENHA_CANON', '')
        return coletar_canon_gx6000(ip, senha)
    return "0", "0", "0"

# --- LOOP PRINCIPAL ---
if __name__ == "__main__":
    config, is_primeira_vez = carregar_ou_criar_config()
    
    tabela_destino = "contador"
    
    if is_primeira_vez:
        print(f"\n--- TESTANDO COMUNICAÇÃO ---")
        print(f"Alvo: {config['IP']} | Modelo: {config['MODELO']}")
        print(f"Cliente: {config['CLIENTE']} | Destino: Tabela '{tabela_destino}'")
        print("Aguarde...\n")
        
        total, pb, cor = executar_coleta(config)

        if total and total != "0":
            print(f"✅ SUCESSO! Total: {total} | P&B: {pb} | Color: {cor}")
            time.sleep(8)
            ocultar_janela() 
        else:
            from tkinter import messagebox
            messagebox.showerror(
                "Coletor GR Cartuchos",
                "Não foi possível ler a impressora. Verifique o IP, modelo e senha.",
            )
            raise SystemExit(1)

    while True:
        total, pb, cor = executar_coleta(config)

        if total and total != "0":
            try:
                enviar_contador(config, total, pb, cor)
                logging.info(
                    f"[{config['MODELO']} - {config['IP']}] Contadores enviados à VPS "
                    f"com sucesso! (Total: {total}, P&B: {pb}, Color: {cor})"
                )
            except Exception as e:
                logging.error(f"Erro ao enviar contadores para a API: {e}")
        
        time.sleep(300)
