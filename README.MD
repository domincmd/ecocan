# EcoCan

Projeto de feira de ciências baseado em NodeJS. Requer um Arduino com programação específica rodando conectado na COM4 (ou altere a porta no código) para funcionar corretamente. Seguem abaixo as instruções de administradores e coisas a fazer, toda a explicação do projeto encontra-se no site hosteado (ou em /html/info, para os impacientes).

## Instruções de Administrador

Nosso manual de instruções do administrador pode ser constituido em 3 seções: a leitura do arduino, a base de dados e o website em si. Veja qualquer uma abaixo:

### Arduino

Assim que o programa iniciar, ele deve mandar no console algo como: 
`[STARTUP] Serial port opened. Listening...`

Isso significa que o programa abriu a porta certa e está "escutando" o Arduino.
Se algum erro ocorrer, verifique-se que:
 - A porta conectada ao arduino é a correta
 - O Arduino IDE está fechado (ele "bloqueia" o acesso caso esteja aberto)

Quando alguma latinha for reciclada, o programa tem que falar algo como
`[ACTION] Code parsed and added: 16756414`.
Isso significa que ele detectou o código e o adicionou à base de dados.

Quando o programa se encerrar, o programa dirá
`[SHUTDOWN] Closing serial port...`.

### Base de dados

Essa parte não tem muito segredo, é mais ver o que tá errado e, se precisar, concertar manualmente. A base de dados se divide em dois locais. 

A grande maioria das coisas está guardada no arquivo data.json, dentro da pasta /tmp. Lá, você pode acessar e mudar algumas coisas, seguindo as regras de formatação JSON. Os EcoPoints, por exemplo, podem ser alterados por lá. Só tenha <b>CERTEZA</b> de que o programa NÃO está rodando enquanto isso, caso o contrário, suas alterações não farão efeito.

As compras estão guardadas no arquivo compras.txt (muito difícil, eu sei), também presente na pasta /tmp. Este arquivo NÃO É LIDO PELO SISTEMA, mas o sistema escreve todas as compras aí. Portanto, se algo der errado, não adianta mudar esse arquivo, ele só serve pra ver as compras :P

### Website

O website é mais complicado, mas a dá pra explicar. O site tem uma página de erro própria (para coisas banais, às quais não se deve preocupar), que fala o código do erro e uma mensagem. Como o autor do programa não sabe o sistema de códigos de erros, todos são 401, mas a mensagem é sempre diferente (e, com sorte, autoexplicativa).

Se você for redirecionado à uma página toda branca com um erro em inglês, aí tem que ficar preocupado, porque isso não foi um erro que o sistema diagnosticou.
 - Se o erro ler `Unable to GET/POST /[algo aqui]`, então fica de boa, isso só significa que a página não está funcionando, o que é triste, mas podia ser pior.
 - Se o erro ler várias linhas de módulos e linhas de código diferentes, então o problema é bem complicado e não deveria acontecer. (Varia muito de caso pra caso, então só boa sorte mesmo)


## Coisas a fazer

 - Remover funcionalidades de ADM FEITO
 - Adicionar documentação FEITO
 - Adicionar URL bonito NAO VAI ROLAR
 - Adicionar logging de console correto e polir em geral TO FAZENDO
 - Adicionar página de sucesso