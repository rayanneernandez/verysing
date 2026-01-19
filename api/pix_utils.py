import binascii

def crc16_ccitt(data: str) -> str:
    crc = 0xFFFF
    poly = 0x1021
    data_bytes = data.encode('utf-8')
    
    for byte in data_bytes:
        crc ^= (byte << 8)
        for _ in range(8):
            if (crc & 0x8000):
                crc = (crc << 1) ^ poly
            else:
                crc <<= 1
        crc &= 0xFFFF
        
    return f"{crc:04X}"

def gerar_payload_pix(chave: str, nome: str, cidade: str, valor: float, txid: str = "***") -> str:
    """
    Gera o payload "Copia e Cola" do PIX (Padrão BR Code).
    """
    nome = nome[:25] # Limite de 25 chars
    cidade = cidade[:15] # Limite de 15 chars
    valor_str = f"{valor:.2f}"
    
    # Payload formatado (IDs fixos do padrão EMV QRCPS)
    # 00 - Payload Format Indicator
    # 26 - Merchant Account Information (GUI + Chave)
    # 52 - Merchant Category Code
    # 53 - Transaction Currency
    # 54 - Transaction Amount
    # 58 - Country Code
    # 59 - Merchant Name
    # 60 - Merchant City
    # 62 - Additional Data Field Template (TxID)
    # 63 - CRC16
    
    payload = (
        f"000201"
        f"26{len('0014br.gov.bcb.pix01' + str(len(chave)) + chave):02}0014br.gov.bcb.pix01{len(chave):02}{chave}"
        f"52040000"
        f"5303986"
        f"54{len(valor_str):02}{valor_str}"
        f"5802BR"
        f"59{len(nome):02}{nome}"
        f"60{len(cidade):02}{cidade}"
        f"62{len('0503' + txid):02}0503{txid}"
        f"6304"
    )
    
    crc = crc16_ccitt(payload)
    return payload + crc