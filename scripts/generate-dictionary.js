#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

// Compact format: "word|definition|pos|tags" (pipe-delimited)
// pos: n=noun, v=verb, adj=adjective, adv=adverb, prep=preposition, conj=conjunction, pron=pronoun, det=determiner, int=interjection
// tags: G=General, I=IELTS, B=Business, T=Travel, R=Reading, M=Movies, A=Academic, D=Daily Life, Te=Technology, H=Health

const POS_MAP = {
  n: 'noun',
  v: 'verb',
  adj: 'adjective',
  adv: 'adverb',
  prep: 'preposition',
  conj: 'conjunction',
  pron: 'pronoun',
  det: 'determiner',
  int: 'interjection',
};
const TAG_MAP = {
  G: 'General',
  I: 'IELTS',
  B: 'Business',
  T: 'Travel',
  R: 'Reading',
  M: 'Movies',
  A: 'Academic',
  D: 'Daily Life',
  Te: 'Technology',
  H: 'Health',
};

// Example sentence templates by POS — rotate based on word hash
const EXAMPLE_TEMPLATES = {
  noun: [
    'The {w} is very important.',
    'I need a {w} for this.',
    'She bought a new {w}.',
    'The {w} was on the table.',
    'We talked about the {w}.',
  ],
  verb: [
    'I {w} every day.',
    'She likes to {w}.',
    'Please {w} carefully.',
    'They {w} together often.',
    'We need to {w} this.',
  ],
  adjective: [
    'The weather is very {w} today.',
    'This food tastes {w}.',
    'She seems very {w}.',
    'The room looks {w}.',
    'It was a {w} experience.',
  ],
  adverb: [
    'She spoke {w}.',
    'He {w} agreed with the plan.',
    'They finished the work {w}.',
    'The car moved {w}.',
    'I {w} understand your point.',
  ],
  preposition: [
    'The book is {w} the table.',
    'She walked {w} the park.',
    'We met {w} the morning.',
    'He stood {w} the door.',
  ],
  conjunction: [
    'I like tea {w} coffee.',
    'She is smart {w} hardworking.',
    'He tried {w} he could not do it.',
  ],
  pronoun: ['{W} can help with this task.', 'Is {w} the right answer?', '{W} should try harder.'],
  determiner: [
    '{W} student passed the exam.',
    'I saw {w} birds in the park.',
    '{W} day is a good day to learn.',
  ],
  interjection: ['{W}! That was unexpected.', '{W}! How are you doing?'],
};

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function generateExample(word, pos) {
  const templates = EXAMPLE_TEMPLATES[pos] || ['This is a sentence with {w}.'];
  const idx = simpleHash(word) % templates.length;
  const W = word.charAt(0).toUpperCase() + word.slice(1);
  return templates[idx].replace(/\{w\}/g, word).replace(/\{W\}/g, W);
}

function parse(line, level) {
  const [word, definition, pos, tags] = line.split('|');
  const fullPos = POS_MAP[pos.trim()] || pos.trim();
  return {
    word: word.trim(),
    definition: definition.trim(),
    partOfSpeech: fullPos,
    ipa: null,
    exampleSentence: generateExample(word.trim(), fullPos),
    difficultyLevel: level,
    topicTags: tags
      .trim()
      .split(',')
      .map((t) => TAG_MAP[t.trim()] || t.trim()),
  };
}

// ============================================================
// LEVEL 0 — Beginner (A1) ~1250 words
// ============================================================
const L0 = `
hello|xin chào|int|G,D
goodbye|tạm biệt|int|G,D
yes|vâng, có|adv|G
no|không|adv|G
please|làm ơn|adv|G,D
thank|cảm ơn|v|G,D
sorry|xin lỗi|adj|G,D
excuse|xin phép|v|G,D
help|giúp đỡ|v|G,D
stop|dừng lại|v|G
go|đi|v|G,D
come|đến|v|G,D
eat|ăn|v|G,D
drink|uống|v|G,D
sleep|ngủ|v|G,D,H
wake|thức dậy|v|G,D
walk|đi bộ|v|G,D,H
run|chạy|v|G,D,H
sit|ngồi|v|G,D
stand|đứng|v|G,D
open|mở|v|G
close|đóng|v|G
read|đọc|v|G,R
write|viết|v|G,R
speak|nói|v|G,I
listen|nghe|v|G,I
see|nhìn thấy|v|G
look|nhìn|v|G
hear|nghe thấy|v|G
feel|cảm thấy|v|G,H
think|nghĩ|v|G
know|biết|v|G
want|muốn|v|G
need|cần|v|G
like|thích|v|G,D
love|yêu|v|G,D
have|có|v|G
give|cho|v|G
take|lấy|v|G
make|làm|v|G
do|làm|v|G
say|nói|v|G
tell|kể, nói|v|G
ask|hỏi|v|G
answer|trả lời|v|G
learn|học|v|G,A
teach|dạy|v|G,A
study|học tập|v|G,A
work|làm việc|v|G,B
play|chơi|v|G,D
buy|mua|v|G,B
sell|bán|v|G,B
pay|trả tiền|v|G,B
cook|nấu ăn|v|G,D
wash|rửa, giặt|v|G,D
clean|dọn dẹp|v|G,D
drive|lái xe|v|G,T
fly|bay|v|G,T
swim|bơi|v|G,H
dance|nhảy múa|v|G,D
sing|hát|v|G,D
draw|vẽ|v|G,D
cut|cắt|v|G
break|vỡ, gãy|v|G
fix|sửa chữa|v|G
build|xây dựng|v|G
carry|mang|v|G
push|đẩy|v|G
pull|kéo|v|G
throw|ném|v|G
catch|bắt|v|G
hold|giữ, cầm|v|G
put|đặt, để|v|G
get|lấy, được|v|G
find|tìm thấy|v|G
lose|mất|v|G
show|cho xem|v|G
hide|giấu, trốn|v|G
wait|đợi, chờ|v|G
start|bắt đầu|v|G
finish|kết thúc|v|G
try|thử|v|G
use|sử dụng|v|G
call|gọi|v|G,Te
send|gửi|v|G,Te
bring|mang đến|v|G
leave|rời đi|v|G
stay|ở lại|v|G,T
move|di chuyển|v|G
turn|quay|v|G
change|thay đổi|v|G
meet|gặp|v|G,D
follow|theo|v|G
watch|xem|v|G,M
live|sống|v|G,D
die|chết|v|G
born|sinh ra|v|G
grow|lớn lên|v|G
fall|ngã, rơi|v|G
laugh|cười|v|G,D
cry|khóc|v|G,D
smile|mỉm cười|v|G,D
water|nước|n|G,D
food|thức ăn|n|G,D
rice|cơm, gạo|n|G,D
bread|bánh mì|n|G,D
meat|thịt|n|G,D
fish|cá|n|G,D
chicken|gà|n|G,D
egg|trứng|n|G,D
milk|sữa|n|G,D
fruit|trái cây|n|G,D
apple|táo|n|G,D
banana|chuối|n|G,D
orange|cam|n|G,D
vegetable|rau|n|G,D,H
salt|muối|n|G,D
sugar|đường|n|G,D
coffee|cà phê|n|G,D
tea|trà|n|G,D
juice|nước ép|n|G,D
soup|súp, canh|n|G,D
cake|bánh ngọt|n|G,D
candy|kẹo|n|G,D
butter|bơ|n|G,D
cheese|phô mai|n|G,D
noodle|mì, phở|n|G,D
mother|mẹ|n|G,D
father|bố, cha|n|G,D
parent|bố mẹ|n|G,D
child|con, đứa trẻ|n|G,D
baby|em bé|n|G,D
brother|anh, em trai|n|G,D
sister|chị, em gái|n|G,D
family|gia đình|n|G,D
friend|bạn bè|n|G,D
husband|chồng|n|G,D
wife|vợ|n|G,D
son|con trai|n|G,D
daughter|con gái|n|G,D
grandfather|ông|n|G,D
grandmother|bà|n|G,D
uncle|chú, bác|n|G,D
aunt|cô, dì|n|G,D
cousin|anh chị em họ|n|G,D
neighbor|hàng xóm|n|G,D
man|đàn ông|n|G
woman|phụ nữ|n|G
boy|con trai|n|G
girl|con gái|n|G
person|người|n|G
people|người, mọi người|n|G
name|tên|n|G
age|tuổi|n|G,D
house|nhà|n|G,D
home|nhà, quê nhà|n|G,D
room|phòng|n|G,D
door|cửa|n|G,D
window|cửa sổ|n|G,D
wall|tường|n|G
floor|sàn nhà|n|G
roof|mái nhà|n|G
bed|giường|n|G,D
table|bàn|n|G,D
chair|ghế|n|G,D
kitchen|nhà bếp|n|G,D
bathroom|phòng tắm|n|G,D
garden|vườn|n|G,D
school|trường học|n|G,A
class|lớp học|n|G,A
teacher|giáo viên|n|G,A
student|học sinh|n|G,A
book|sách|n|G,R
pen|bút|n|G,A
paper|giấy|n|G,A
number|số|n|G,A
letter|chữ cái, thư|n|G,A
word|từ|n|G,A,R
question|câu hỏi|n|G,A
test|bài kiểm tra|n|G,A
hospital|bệnh viện|n|G,H
doctor|bác sĩ|n|G,H
nurse|y tá|n|G,H
medicine|thuốc|n|G,H
sick|ốm, bệnh|adj|G,H
healthy|khỏe mạnh|adj|G,H
pain|đau|n|G,H
head|đầu|n|G,H
eye|mắt|n|G,H
ear|tai|n|G,H
nose|mũi|n|G,H
mouth|miệng|n|G,H
tooth|răng|n|G,H
hand|tay|n|G,H
finger|ngón tay|n|G,H
arm|cánh tay|n|G,H
leg|chân|n|G,H
foot|bàn chân|n|G,H
heart|trái tim|n|G,H
body|cơ thể|n|G,H
face|mặt|n|G,H
hair|tóc|n|G,H
back|lưng|n|G,H
stomach|bụng, dạ dày|n|G,H
blood|máu|n|G,H
bone|xương|n|G,H
skin|da|n|G,H
cat|mèo|n|G,D
dog|chó|n|G,D
bird|chim|n|G
cow|bò|n|G
pig|heo, lợn|n|G
horse|ngựa|n|G
monkey|khỉ|n|G
elephant|voi|n|G
tiger|hổ|n|G
lion|sư tử|n|G
bear|gấu|n|G
rabbit|thỏ|n|G
mouse|chuột|n|G
snake|rắn|n|G
duck|vịt|n|G,D
sheep|cừu|n|G
ant|kiến|n|G
butterfly|bướm|n|G
red|đỏ|adj|G
blue|xanh dương|adj|G
green|xanh lá cây|adj|G
yellow|vàng|adj|G
white|trắng|adj|G
black|đen|adj|G
brown|nâu|adj|G
pink|hồng|adj|G
purple|tím|adj|G
gray|xám|adj|G
color|màu sắc|n|G
one|một|n|G
two|hai|n|G
three|ba|n|G
four|bốn|n|G
five|năm|n|G
six|sáu|n|G
seven|bảy|n|G
eight|tám|n|G
nine|chín|n|G
ten|mười|n|G
hundred|trăm|n|G
thousand|nghìn|n|G
first|thứ nhất|adj|G
second|thứ hai|adj|G
third|thứ ba|adj|G
last|cuối cùng|adj|G
half|một nửa|n|G
zero|số không|n|G
big|to, lớn|adj|G
small|nhỏ|adj|G
long|dài|adj|G
short|ngắn, thấp|adj|G
tall|cao|adj|G
fat|béo, mập|adj|G
thin|gầy, mỏng|adj|G
old|già, cũ|adj|G
young|trẻ|adj|G
new|mới|adj|G
good|tốt|adj|G
bad|xấu, tệ|adj|G
hot|nóng|adj|G
cold|lạnh|adj|G
warm|ấm|adj|G
cool|mát|adj|G
fast|nhanh|adj|G
slow|chậm|adj|G
strong|mạnh, khỏe|adj|G
weak|yếu|adj|G
hard|cứng, khó|adj|G
soft|mềm|adj|G
easy|dễ|adj|G
difficult|khó|adj|G
happy|vui, hạnh phúc|adj|G,D
sad|buồn|adj|G,D
angry|giận, tức|adj|G,D
tired|mệt|adj|G,D
hungry|đói|adj|G,D
thirsty|khát|adj|G,D
full|no, đầy|adj|G,D
empty|trống|adj|G
beautiful|đẹp|adj|G
ugly|xấu xí|adj|G
clean|sạch|adj|G,D
dirty|bẩn|adj|G,D
dry|khô|adj|G
wet|ướt|adj|G
dark|tối|adj|G
light|sáng, nhẹ|adj|G
heavy|nặng|adj|G
rich|giàu|adj|G,B
poor|nghèo|adj|G
cheap|rẻ|adj|G,B
expensive|đắt|adj|G,B
free|miễn phí, tự do|adj|G
busy|bận|adj|G,B
quiet|yên tĩnh|adj|G,D
loud|ồn ào|adj|G
safe|an toàn|adj|G
dangerous|nguy hiểm|adj|G
right|đúng, phải|adj|G
wrong|sai|adj|G
same|giống|adj|G
different|khác|adj|G
important|quan trọng|adj|G
possible|có thể|adj|G
ready|sẵn sàng|adj|G
sure|chắc chắn|adj|G
afraid|sợ|adj|G,D
alone|một mình|adj|G,D
alive|sống|adj|G
dead|chết|adj|G
true|đúng, thật|adj|G
false|sai|adj|G
nice|tốt, đẹp|adj|G,D
kind|tốt bụng|adj|G,D
funny|vui, hài hước|adj|G,D,M
interesting|thú vị|adj|G
boring|nhàm chán|adj|G
favorite|yêu thích|adj|G,D
special|đặc biệt|adj|G
simple|đơn giản|adj|G
near|gần|adj|G
far|xa|adj|G
early|sớm|adj|G
late|muộn, trễ|adj|G
next|tiếp theo|adj|G
time|thời gian|n|G
day|ngày|n|G
night|đêm|n|G
morning|buổi sáng|n|G,D
afternoon|buổi chiều|n|G,D
evening|buổi tối|n|G,D
today|hôm nay|n|G
tomorrow|ngày mai|n|G
yesterday|hôm qua|n|G
week|tuần|n|G
month|tháng|n|G
year|năm|n|G
hour|giờ|n|G
minute|phút|n|G
clock|đồng hồ|n|G,D
Monday|thứ hai|n|G
Sunday|chủ nhật|n|G
birthday|sinh nhật|n|G,D
holiday|ngày lễ|n|G,D
season|mùa|n|G
spring|mùa xuân|n|G
summer|mùa hè|n|G
autumn|mùa thu|n|G
winter|mùa đông|n|G
weather|thời tiết|n|G,D
rain|mưa|n|G
snow|tuyết|n|G
sun|mặt trời|n|G
moon|mặt trăng|n|G
star|ngôi sao|n|G
cloud|mây|n|G
wind|gió|n|G
sky|bầu trời|n|G
tree|cây|n|G
flower|hoa|n|G
grass|cỏ|n|G
mountain|núi|n|G,T
river|sông|n|G,T
lake|hồ|n|G,T
sea|biển|n|G,T
beach|bãi biển|n|G,T
island|đảo|n|G,T
forest|rừng|n|G,T
land|đất|n|G
stone|đá|n|G
fire|lửa|n|G
air|không khí|n|G
earth|trái đất|n|G
city|thành phố|n|G,T
town|thị trấn|n|G
village|làng|n|G
country|đất nước, quốc gia|n|G,T
street|đường phố|n|G,T
road|đường|n|G,T
bridge|cầu|n|G
park|công viên|n|G,D
market|chợ|n|G,B
shop|cửa hàng|n|G,B
store|cửa hàng|n|G,B
restaurant|nhà hàng|n|G,D,T
hotel|khách sạn|n|G,T
airport|sân bay|n|G,T
bank|ngân hàng|n|G,B
office|văn phòng|n|G,B
church|nhà thờ|n|G
library|thư viện|n|G,A,R
museum|bảo tàng|n|G,T
car|xe hơi|n|G,T
bus|xe buýt|n|G,T
train|tàu hỏa|n|G,T
bicycle|xe đạp|n|G,D
boat|thuyền|n|G,T
plane|máy bay|n|G,T
taxi|xe taxi|n|G,T
ticket|vé|n|G,T
map|bản đồ|n|G,T
passport|hộ chiếu|n|G,T
luggage|hành lý|n|G,T
money|tiền|n|G,B
price|giá|n|G,B
job|công việc|n|G,B
company|công ty|n|G,B
boss|sếp|n|G,B
meeting|cuộc họp|n|G,B
phone|điện thoại|n|G,Te
computer|máy tính|n|G,Te
internet|mạng internet|n|G,Te
television|tivi|n|G,D,Te
camera|máy ảnh|n|G,Te
music|âm nhạc|n|G,D,M
song|bài hát|n|G,D,M
movie|phim|n|G,M
game|trò chơi|n|G,D
sport|thể thao|n|G,D,H
ball|quả bóng|n|G,D
team|đội|n|G,D
win|thắng|v|G,D
shirt|áo sơ mi|n|G,D
dress|váy|n|G,D
pants|quần|n|G,D
shoes|giày|n|G,D
hat|mũ, nón|n|G,D
bag|túi, cặp|n|G,D
coat|áo khoác|n|G,D
glasses|kính|n|G,D
ring|nhẫn|n|G,D
watch|đồng hồ đeo tay|n|G,D
key|chìa khóa|n|G,D
picture|hình ảnh|n|G
photo|ảnh chụp|n|G,D
gift|quà tặng|n|G,D
toy|đồ chơi|n|G,D
language|ngôn ngữ|n|G,A
English|tiếng Anh|n|G,A
Vietnamese|tiếng Việt|n|G,A
math|toán|n|G,A
history|lịch sử|n|G,A,R
science|khoa học|n|G,A
art|nghệ thuật|n|G,A
color|màu sắc|n|G
idea|ý tưởng|n|G
problem|vấn đề|n|G
story|câu chuyện|n|G,R
news|tin tức|n|G,R
example|ví dụ|n|G,A
rule|quy tắc|n|G
group|nhóm|n|G
part|phần|n|G
place|nơi, chỗ|n|G
way|cách, đường|n|G
end|kết thúc|n|G
side|bên, phía|n|G
point|điểm|n|G
line|đường, dòng|n|G
top|đỉnh|n|G
bottom|đáy|n|G
middle|giữa|n|G
corner|góc|n|G
inside|bên trong|adv|G
outside|bên ngoài|adv|G
up|lên|adv|G
down|xuống|adv|G
here|ở đây|adv|G
there|ở đó|adv|G
where|ở đâu|adv|G
when|khi nào|adv|G
how|thế nào|adv|G
why|tại sao|adv|G
what|cái gì|pron|G
who|ai|pron|G
which|nào, cái nào|pron|G
this|cái này|det|G
that|cái đó|det|G
these|những cái này|det|G
those|những cái đó|det|G
my|của tôi|det|G
your|của bạn|det|G
his|của anh ấy|det|G
her|của cô ấy|det|G
our|của chúng tôi|det|G
their|của họ|det|G
I|tôi|pron|G
you|bạn|pron|G
he|anh ấy|pron|G
she|cô ấy|pron|G
it|nó|pron|G
we|chúng tôi|pron|G
they|họ|pron|G
me|tôi|pron|G
him|anh ấy|pron|G
us|chúng tôi|pron|G
them|họ|pron|G
and|và|conj|G
but|nhưng|conj|G
or|hoặc|conj|G
because|bởi vì|conj|G
if|nếu|conj|G
so|vì vậy|conj|G
then|sau đó|adv|G
also|cũng|adv|G
very|rất|adv|G
too|quá, cũng|adv|G
really|thực sự|adv|G
always|luôn luôn|adv|G
never|không bao giờ|adv|G
sometimes|đôi khi|adv|G
often|thường xuyên|adv|G
usually|thường|adv|G
already|đã, rồi|adv|G
still|vẫn|adv|G
again|lại|adv|G
only|chỉ|adv|G
just|chỉ, vừa mới|adv|G
now|bây giờ|adv|G
today|hôm nay|adv|G
soon|sớm|adv|G
well|tốt, khỏe|adv|G
together|cùng nhau|adv|G,D
maybe|có lẽ|adv|G
about|khoảng, về|prep|G
with|với|prep|G
without|không có|prep|G
for|cho, vì|prep|G
from|từ|prep|G
to|đến|prep|G
in|trong|prep|G
on|trên|prep|G
at|tại|prep|G
by|bởi, bằng|prep|G
of|của|prep|G
between|giữa|prep|G
before|trước|prep|G
after|sau|prep|G
during|trong suốt|prep|G
under|dưới|prep|G
over|trên, qua|prep|G
behind|phía sau|prep|G
across|qua, bên kia|prep|G
around|xung quanh|prep|G
through|xuyên qua|prep|G
into|vào trong|prep|G
along|dọc theo|prep|G
toward|hướng về|prep|G
against|chống lại|prep|G
until|cho đến khi|prep|G
since|từ khi|prep|G
everything|mọi thứ|pron|G
nothing|không gì|pron|G
something|cái gì đó|pron|G
everyone|mọi người|pron|G
nobody|không ai|pron|G
someone|ai đó|pron|G
each|mỗi|det|G
every|mỗi, mọi|det|G
many|nhiều|det|G
much|nhiều|det|G
some|một số|det|G
any|bất kỳ|det|G
few|một vài|det|G
all|tất cả|det|G
other|khác|det|G
another|khác, thêm|det|G
both|cả hai|det|G
own|riêng|det|G
such|như vậy|det|G
enough|đủ|det|G
several|một vài|det|G
whole|toàn bộ|det|G
`;

// ============================================================
// LEVEL 1 — Pre-Intermediate (A2) ~1250 words
// ============================================================
const L1 = `
accept|chấp nhận|v|G,B
achieve|đạt được|v|G,I,A
add|thêm vào|v|G
admit|thừa nhận|v|G
advice|lời khuyên|n|G,D
afford|có khả năng chi trả|v|G,B
agree|đồng ý|v|G
allow|cho phép|v|G
appear|xuất hiện|v|G
apply|áp dụng, nộp đơn|v|G,B
arrange|sắp xếp|v|G
arrive|đến nơi|v|G,T
attack|tấn công|v|G
attempt|cố gắng|v|G
attend|tham dự|v|G,B,A
attract|thu hút|v|G
avoid|tránh|v|G
basic|cơ bản|adj|G
battle|trận chiến|n|G,R
beat|đánh bại|v|G
become|trở thành|v|G
behave|cư xử|v|G,D
believe|tin tưởng|v|G
belong|thuộc về|v|G
borrow|mượn|v|G,D
bother|làm phiền|v|G,D
brave|dũng cảm|adj|G
bright|sáng, thông minh|adj|G
burn|cháy, đốt|v|G
calm|bình tĩnh|adj|G,D
cancel|hủy bỏ|v|G,B
capable|có khả năng|adj|G
capital|thủ đô, vốn|n|G,B
care|quan tâm|v|G,D
careful|cẩn thận|adj|G,D
careless|bất cẩn|adj|G
cause|nguyên nhân, gây ra|n|G
celebrate|kỷ niệm, ăn mừng|v|G,D
certain|chắc chắn|adj|G
challenge|thử thách|n|G,I
chance|cơ hội|n|G
character|nhân vật, tính cách|n|G,R,M
charge|phí, sạc|n|G,B,Te
check|kiểm tra|v|G
choice|sự lựa chọn|n|G
choose|chọn|v|G
circle|hình tròn|n|G
claim|tuyên bố|v|G,B
clear|rõ ràng|adj|G
climb|leo|v|G,T
collect|sưu tập, thu thập|v|G
comfortable|thoải mái|adj|G,D
common|phổ biến|adj|G
communicate|giao tiếp|v|G,I
compare|so sánh|v|G,A
complain|phàn nàn|v|G,D
complete|hoàn thành|v|G
concern|lo ngại|n|G
condition|điều kiện|n|G,H
confident|tự tin|adj|G,I
confirm|xác nhận|v|G,B
confuse|nhầm lẫn|v|G
connect|kết nối|v|G,Te
consider|xem xét|v|G
contain|chứa|v|G
continue|tiếp tục|v|G
control|kiểm soát|v|G
convenient|thuận tiện|adj|G
conversation|cuộc hội thoại|n|G,I
copy|sao chép|v|G
correct|đúng, sửa|adj|G,A
cost|chi phí, giá|n|G,B
count|đếm|v|G
couple|cặp đôi|n|G,D
courage|dũng khí|n|G
cover|che, bao phủ|v|G
create|tạo ra|v|G,Te
cross|băng qua|v|G
crowd|đám đông|n|G
curious|tò mò|adj|G
current|hiện tại|adj|G
customer|khách hàng|n|G,B
daily|hàng ngày|adj|G,D
damage|thiệt hại|n|G
data|dữ liệu|n|G,Te,A
deal|thỏa thuận|n|G,B
decide|quyết định|v|G
deliver|giao hàng|v|G,B
demand|yêu cầu|n|G,B
depend|phụ thuộc|v|G
describe|mô tả|v|G,I
design|thiết kế|n|G,Te
destroy|phá hủy|v|G
detail|chi tiết|n|G
develop|phát triển|v|G,B,Te
device|thiết bị|n|G,Te
direction|hướng, phương hướng|n|G,T
disappear|biến mất|v|G
discover|khám phá|v|G,A
discuss|thảo luận|v|G,I,A
disease|bệnh|n|G,H
distance|khoảng cách|n|G
divide|chia|v|G
doubt|nghi ngờ|n|G
dream|giấc mơ|n|G,D
drop|rơi, giọt|v|G
during|trong suốt|prep|G
duty|nhiệm vụ|n|G,B
earn|kiếm được|v|G,B
education|giáo dục|n|G,A
effect|hiệu quả|n|G,A
effort|nỗ lực|n|G
electricity|điện|n|G,Te
emotion|cảm xúc|n|G,D
employee|nhân viên|n|G,B
encourage|khuyến khích|v|G
enemy|kẻ thù|n|G
energy|năng lượng|n|G,H,Te
engine|động cơ|n|G,Te
enjoy|tận hưởng|v|G,D
enter|vào|v|G
environment|môi trường|n|G,I,A
equal|bằng nhau|adj|G
equipment|thiết bị|n|G,B
escape|thoát|v|G,M
especially|đặc biệt|adv|G
event|sự kiện|n|G,B
evidence|bằng chứng|n|G,A
exact|chính xác|adj|G
examine|kiểm tra|v|G,A,H
excellent|xuất sắc|adj|G
except|ngoại trừ|prep|G
exchange|trao đổi|v|G,B
excited|hào hứng|adj|G,D
exercise|bài tập, tập thể dục|n|G,H,A
exist|tồn tại|v|G
expect|mong đợi|v|G
experience|kinh nghiệm|n|G,B,I
experiment|thí nghiệm|n|G,A
explain|giải thích|v|G,A
explore|khám phá|v|G,T
express|diễn đạt|v|G,I
extra|thêm|adj|G
face|đối mặt|v|G
fact|sự thật|n|G,A
fail|thất bại|v|G,A
fair|công bằng|adj|G
faith|niềm tin|n|G
familiar|quen thuộc|adj|G
famous|nổi tiếng|adj|G,I
fan|quạt, fan hâm mộ|n|G,D
fault|lỗi|n|G
fear|sợ hãi|n|G,D
feature|đặc điểm|n|G,Te
feed|cho ăn|v|G,D
female|nữ|adj|G
fight|chiến đấu|v|G
figure|hình, con số|n|G
fill|đổ đầy|v|G
final|cuối cùng|adj|G
fit|vừa, phù hợp|v|G
flat|phẳng, căn hộ|adj|G
focus|tập trung|v|G,A
folk|dân gian|n|G
force|lực, buộc|n|G
foreign|nước ngoài|adj|G,T
forever|mãi mãi|adv|G,D
forget|quên|v|G
forgive|tha thứ|v|G,D
form|hình thức, biểu mẫu|n|G,B
former|trước đây|adj|G
forward|phía trước|adv|G
found|thành lập|v|G,B
freedom|tự do|n|G,I
fresh|tươi|adj|G,D
frighten|làm sợ|v|G
fuel|nhiên liệu|n|G
fun|vui vẻ|n|G,D
function|chức năng|n|G,Te
furniture|đồ nội thất|n|G,D
future|tương lai|n|G,I
gain|đạt được|v|G,B
general|chung, tổng quát|adj|G
generation|thế hệ|n|G
gentle|nhẹ nhàng|adj|G,D
giant|khổng lồ|adj|G
glad|vui mừng|adj|G,D
global|toàn cầu|adj|G,I,B
goal|mục tiêu|n|G,I,B
government|chính phủ|n|G,I
grade|điểm, lớp|n|G,A
grateful|biết ơn|adj|G,D
guard|bảo vệ|v|G
guess|đoán|v|G
guide|hướng dẫn|n|G,T
guilty|có tội|adj|G
habit|thói quen|n|G,D,H
handle|xử lý|v|G,B
hang|treo|v|G
happen|xảy ra|v|G
hardly|hầu như không|adv|G
harm|gây hại|v|G,H
hate|ghét|v|G,D
heading|tiêu đề|n|G,R
heat|nhiệt|n|G
height|chiều cao|n|G
hero|anh hùng|n|G,M,R
huge|rất lớn|adj|G
human|con người|n|G
humor|sự hài hước|n|G,D
hunt|săn bắn|v|G
hurry|vội vàng|v|G,D
hurt|làm đau|v|G,H
identify|nhận dạng|v|G
ignore|phớt lờ|v|G,D
imagine|tưởng tượng|v|G
immediately|ngay lập tức|adv|G
improve|cải thiện|v|G,I,H
include|bao gồm|v|G
income|thu nhập|n|G,B
increase|tăng|v|G,B
independent|độc lập|adj|G,I
industry|công nghiệp|n|G,B
influence|ảnh hưởng|n|G,I
information|thông tin|n|G,Te
injure|làm bị thương|v|G,H
insect|côn trùng|n|G
inspect|kiểm tra|v|G,B
instruction|hướng dẫn|n|G,A
instrument|nhạc cụ, dụng cụ|n|G
insurance|bảo hiểm|n|G,B,H
intelligent|thông minh|adj|G
intend|dự định|v|G
interest|sự quan tâm, lãi suất|n|G,B
introduce|giới thiệu|v|G,I
invent|phát minh|v|G,A,Te
invest|đầu tư|v|G,B
invite|mời|v|G,D
involve|liên quan|v|G
issue|vấn đề|n|G,B
item|mục, món đồ|n|G,B
jail|nhà tù|n|G
join|tham gia|v|G,D
joke|truyện cười|n|G,D
journey|hành trình|n|G,T
judge|thẩm phán, đánh giá|n|G
junior|cấp dưới|adj|G,B
justice|công lý|n|G
kick|đá|v|G,D
knowledge|kiến thức|n|G,A
labor|lao động|n|G,B
lack|thiếu|n|G
latest|mới nhất|adj|G,Te
lead|dẫn dắt|v|G,B
leader|lãnh đạo|n|G,B
league|giải đấu|n|G
lean|nghiêng, gầy|v|G
legal|hợp pháp|adj|G,B
lend|cho vay|v|G,B
lesson|bài học|n|G,A
level|cấp độ|n|G,A
limit|giới hạn|n|G
link|liên kết|n|G,Te
list|danh sách|n|G
local|địa phương|adj|G
lock|khóa|v|G
lonely|cô đơn|adj|G,D
loud|ồn ào|adj|G
lucky|may mắn|adj|G,D
machine|máy móc|n|G,Te
main|chính|adj|G
major|lớn, quan trọng|adj|G
manage|quản lý|v|G,B
manner|cách thức|n|G
mark|dấu, điểm|n|G,A
mass|khối lượng|n|G,A
match|trận đấu, phù hợp|n|G
material|vật liệu|n|G
matter|vấn đề|n|G
measure|đo lường|v|G,A
member|thành viên|n|G,B
memory|trí nhớ|n|G
mental|tinh thần|adj|G,H
mention|đề cập|v|G
mess|bừa bộn|n|G,D
message|tin nhắn|n|G,Te
method|phương pháp|n|G,A
million|triệu|n|G
mind|tâm trí|n|G,H
minor|nhỏ|adj|G
mistake|lỗi, sai lầm|n|G
mix|trộn|v|G
modern|hiện đại|adj|G
moment|khoảnh khắc|n|G
moral|đạo đức|adj|G
motion|chuyển động|n|G
murder|giết người|n|G
narrow|hẹp|adj|G
nation|quốc gia|n|G,I
native|bản địa|adj|G,I
natural|tự nhiên|adj|G
nature|thiên nhiên|n|G
necessary|cần thiết|adj|G
negative|tiêu cực|adj|G
neither|không... cũng không|conj|G
network|mạng lưới|n|G,Te,B
normal|bình thường|adj|G
notice|chú ý|v|G
novel|tiểu thuyết|n|G,R
object|vật thể, phản đối|n|G
observe|quan sát|v|G,A
obtain|đạt được|v|G
obvious|rõ ràng|adj|G
occasion|dịp|n|G,D
occur|xảy ra|v|G
odd|kỳ lạ|adj|G
offer|đề nghị|v|G,B
operate|vận hành|v|G,Te
opinion|ý kiến|n|G,I
oppose|phản đối|v|G
option|lựa chọn|n|G
order|đặt hàng, thứ tự|n|G,B
ordinary|bình thường|adj|G
organize|tổ chức|v|G,B
original|gốc, nguyên bản|adj|G
overcome|vượt qua|v|G,I
owe|nợ|v|G,B
pace|nhịp độ|n|G
pack|đóng gói|v|G,T
particular|cụ thể|adj|G
pass|qua, đậu|v|G,A
passage|đoạn văn|n|G,R,A
passenger|hành khách|n|G,T
patient|bệnh nhân, kiên nhẫn|n|G,H
pattern|mẫu|n|G
pause|tạm dừng|v|G
peace|hòa bình|n|G,I
percent|phần trăm|n|G,A
perform|biểu diễn|v|G,M
period|thời kỳ|n|G,A
permanent|vĩnh viễn|adj|G
permit|cho phép|v|G
personal|cá nhân|adj|G,D
physical|thể chất|adj|G,H
pile|đống|n|G
plain|đơn giản, đồng bằng|adj|G
plan|kế hoạch|n|G,B
pleasant|dễ chịu|adj|G,D
plenty|nhiều|n|G
pocket|túi|n|G,D
poem|bài thơ|n|G,R
poison|chất độc|n|G,H
polite|lịch sự|adj|G,D
political|chính trị|adj|G,I
population|dân số|n|G,I
positive|tích cực|adj|G,H
possess|sở hữu|v|G
pour|đổ, rót|v|G
power|sức mạnh, quyền lực|n|G
practice|thực hành|n|G,A,I
praise|khen ngợi|v|G,D
pray|cầu nguyện|v|G
predict|dự đoán|v|G,A
prefer|thích hơn|v|G,D
prepare|chuẩn bị|v|G,I
present|hiện tại, quà|n|G,D
press|ấn, báo chí|v|G
pretend|giả vờ|v|G
prevent|ngăn chặn|v|G,H
previous|trước đó|adj|G
pride|niềm tự hào|n|G
prince|hoàng tử|n|G,R
princess|công chúa|n|G,R
principle|nguyên tắc|n|G,A
print|in|v|G,Te
private|riêng tư|adj|G
prize|giải thưởng|n|G
produce|sản xuất|v|G,B
product|sản phẩm|n|G,B
profession|nghề nghiệp|n|G,B
professor|giáo sư|n|G,A
profit|lợi nhuận|n|G,B
program|chương trình|n|G,Te
progress|tiến bộ|n|G,I
promise|hứa|v|G,D
promote|thăng chức, quảng bá|v|G,B
proper|đúng đắn|adj|G
property|tài sản|n|G,B
protect|bảo vệ|v|G
proud|tự hào|adj|G,D
prove|chứng minh|v|G,A
provide|cung cấp|v|G,B
public|công cộng|adj|G
publish|xuất bản|v|G,R
punish|trừng phạt|v|G
purpose|mục đích|n|G
quality|chất lượng|n|G,B
quantity|số lượng|n|G
quarter|một phần tư|n|G
race|cuộc đua, chủng tộc|n|G
raise|nâng lên, nuôi|v|G
range|phạm vi|n|G
rapid|nhanh chóng|adj|G
rare|hiếm|adj|G
rate|tỷ lệ|n|G,B
reach|đạt tới|v|G
react|phản ứng|v|G,A
realize|nhận ra|v|G
reason|lý do|n|G
receive|nhận|v|G
recent|gần đây|adj|G
recognize|nhận ra|v|G
recommend|đề xuất|v|G,I
record|ghi lại|v|G
reduce|giảm|v|G,B
refer|đề cập|v|G
reflect|phản chiếu|v|G
region|khu vực|n|G,T
regret|hối hận|v|G,D
regular|thường xuyên|adj|G
relate|liên quan|v|G
relationship|mối quan hệ|n|G,D
relax|thư giãn|v|G,D,H
release|phát hành|v|G,Te,M
relief|nhẹ nhõm|n|G
religion|tôn giáo|n|G
remain|vẫn còn|v|G
remember|nhớ|v|G
remind|nhắc nhở|v|G
remove|gỡ bỏ|v|G
rent|thuê|v|G,D
repair|sửa chữa|v|G
repeat|lặp lại|v|G,A
replace|thay thế|v|G
report|báo cáo|n|G,B,A
represent|đại diện|v|G
request|yêu cầu|n|G,B
require|yêu cầu|v|G
research|nghiên cứu|n|G,A
reserve|đặt trước|v|G,T
resident|cư dân|n|G
respect|tôn trọng|n|G,D
responsible|có trách nhiệm|adj|G,B
rest|nghỉ ngơi|n|G,H
result|kết quả|n|G,A
retire|nghỉ hưu|v|G,B
return|trở lại|v|G
reveal|tiết lộ|v|G
review|đánh giá|n|G,A,B
reward|phần thưởng|n|G
risk|rủi ro|n|G,B,H
role|vai trò|n|G,M,B
romantic|lãng mạn|adj|G,D,M
rough|thô ráp|adj|G
round|tròn|adj|G
route|tuyến đường|n|G,T
royal|hoàng gia|adj|G,R
satisfy|thỏa mãn|v|G
save|tiết kiệm, cứu|v|G,B
scene|cảnh|n|G,M
schedule|lịch trình|n|G,B
score|điểm số|n|G,A
search|tìm kiếm|v|G,Te
seat|chỗ ngồi|n|G,T
secret|bí mật|n|G,D
section|phần|n|G
security|an ninh|n|G,B,Te
seek|tìm kiếm|v|G
select|chọn|v|G,Te
senior|cấp cao|adj|G,B
sense|giác quan, ý nghĩa|n|G
separate|tách biệt|v|G
serious|nghiêm trọng|adj|G
serve|phục vụ|v|G,B
service|dịch vụ|n|G,B
set|bộ, đặt|n|G
settle|giải quyết, định cư|v|G
shake|rung, lắc|v|G
shape|hình dạng|n|G
share|chia sẻ|v|G,D,Te
sharp|sắc|adj|G
shelter|nơi trú ẩn|n|G
shift|ca, thay đổi|n|G,B
shine|tỏa sáng|v|G
shock|sốc|n|G,D
shoot|bắn|v|G,M
sight|tầm nhìn|n|G
sign|dấu hiệu, ký|n|G
signal|tín hiệu|n|G,Te
silence|sự im lặng|n|G
silly|ngớ ngẩn|adj|G,D
similar|tương tự|adj|G
single|đơn lẻ, độc thân|adj|G,D
situation|tình huống|n|G
skill|kỹ năng|n|G,B,I
slight|nhẹ|adj|G
smart|thông minh|adj|G,D,Te
smooth|mịn, trơn|adj|G
society|xã hội|n|G,I
soldier|người lính|n|G
solution|giải pháp|n|G,B,A
sort|loại, phân loại|n|G
source|nguồn|n|G,A,Te
speech|bài phát biểu|n|G,I
speed|tốc độ|n|G
spirit|tinh thần|n|G
spread|lan truyền|v|G,H
stage|sân khấu, giai đoạn|n|G,M
standard|tiêu chuẩn|n|G,B
state|trạng thái, bang|n|G
statement|tuyên bố|n|G,B
station|trạm, ga|n|G,T
step|bước|n|G
stick|gắn, que|v|G
stomach|bao tử|n|G,H
store|lưu trữ|v|G,Te
straight|thẳng|adj|G
strange|lạ|adj|G
strength|sức mạnh|n|G,H
stress|căng thẳng|n|G,H
strike|đình công, đánh|v|G,B
structure|cấu trúc|n|G,A
struggle|đấu tranh|v|G
stuff|đồ đạc|n|G,D
stupid|ngu ngốc|adj|G,D
style|phong cách|n|G,D
subject|chủ đề, môn học|n|G,A
succeed|thành công|v|G,B
success|thành công|n|G,B,I
sudden|đột ngột|adj|G
suffer|chịu đựng|v|G,H
suggest|đề xuất|v|G
suit|bộ vest, phù hợp|n|G,B
supply|cung cấp|v|G,B
support|hỗ trợ|v|G
suppose|giả sử|v|G
surface|bề mặt|n|G
surprise|bất ngờ|n|G,D
surround|bao quanh|v|G
survive|sống sót|v|G
suspect|nghi ngờ|v|G
sweet|ngọt|adj|G,D
symbol|biểu tượng|n|G,A
system|hệ thống|n|G,Te
talent|tài năng|n|G
target|mục tiêu|n|G,B
task|nhiệm vụ|n|G,B
tax|thuế|n|G,B
technique|kỹ thuật|n|G,A
technology|công nghệ|n|G,Te
temperature|nhiệt độ|n|G,H
tend|có xu hướng|v|G
terrible|kinh khủng|adj|G
theory|lý thuyết|n|G,A
threat|mối đe dọa|n|G
tip|mẹo, tiền boa|n|G,D,T
title|tiêu đề|n|G,R
total|tổng cộng|n|G
touch|chạm|v|G
tough|cứng, khó khăn|adj|G
toward|hướng về|prep|G
trade|thương mại|n|G,B
tradition|truyền thống|n|G,D,I
traffic|giao thông|n|G,T
transfer|chuyển|v|G,B
transport|vận chuyển|n|G,T
travel|du lịch|v|G,T
treasure|kho báu|n|G,R
treat|đối xử, điều trị|v|G,H
trend|xu hướng|n|G,B,Te
trick|mánh khóe|n|G
trip|chuyến đi|n|G,T
trouble|rắc rối|n|G
trust|tin tưởng|v|G,D
truth|sự thật|n|G
type|loại, gõ|n|G,Te
typical|điển hình|adj|G
ugly|xấu xí|adj|G
unable|không thể|adj|G
unfortunately|thật không may|adv|G
union|liên minh|n|G,B
unit|đơn vị|n|G,A
unite|đoàn kết|v|G
universe|vũ trụ|n|G,A
university|đại học|n|G,A
unless|trừ khi|conj|G
unlikely|không chắc|adj|G
unusual|bất thường|adj|G
update|cập nhật|v|G,Te
upon|trên|prep|G
useful|hữu ích|adj|G
usual|thường lệ|adj|G
vacation|kỳ nghỉ|n|G,T
valley|thung lũng|n|G,T
valuable|quý giá|adj|G,B
value|giá trị|n|G,B
variety|sự đa dạng|n|G
various|nhiều loại|adj|G
version|phiên bản|n|G,Te
victim|nạn nhân|n|G
violence|bạo lực|n|G
vision|tầm nhìn|n|G,H
visit|thăm|v|G,T
voice|giọng nói|n|G
volume|âm lượng, thể tích|n|G
vote|bỏ phiếu|v|G
wage|tiền lương|n|G,B
warn|cảnh báo|v|G
waste|lãng phí|v|G
wealth|sự giàu có|n|G,B
weapon|vũ khí|n|G
wear|mặc|v|G,D
weight|cân nặng|n|G,H
welcome|chào mừng|v|G,D,T
whenever|bất cứ khi nào|conj|G
whether|liệu, cho dù|conj|G
whom|ai (tân ngữ)|pron|G
wide|rộng|adj|G
wild|hoang dã|adj|G
willing|sẵn lòng|adj|G
wire|dây|n|G,Te
wise|khôn ngoan|adj|G
wish|ước muốn|v|G,D
within|bên trong|prep|G
wonder|thắc mắc|v|G
wood|gỗ|n|G
worth|đáng giá|adj|G
wound|vết thương|n|G,H
youth|tuổi trẻ|n|G
zone|khu vực|n|G
`;

// ============================================================
// LEVEL 2 — Intermediate (B1) ~1200 words
// ============================================================
const L2 = `
abandon|bỏ rơi, từ bỏ|v|G,I
absorb|hấp thụ|v|G,A
abstract|trừu tượng|adj|A,I
abuse|lạm dụng|v|G,H
academic|học thuật|adj|A,I
accelerate|tăng tốc|v|G,Te
accomplish|hoàn thành|v|G,B
account|tài khoản|n|B,Te
accurate|chính xác|adj|G,A
accuse|buộc tội|v|G
adapt|thích nghi|v|G,I
adequate|đầy đủ|adj|G,I
adjust|điều chỉnh|v|G,Te
administration|quản trị|n|B
admire|ngưỡng mộ|v|G,D
adopt|nhận nuôi, áp dụng|v|G,D
advance|tiến bộ|v|G,A,Te
advantage|lợi thế|n|G,B,I
adventure|phiêu lưu|n|T,M
advertise|quảng cáo|v|B
advocate|ủng hộ|v|G,I
aesthetic|thẩm mỹ|adj|G,A
agriculture|nông nghiệp|n|G,I
allocation|phân bổ|n|B
alliance|liên minh|n|G,I
alter|thay đổi|v|G
alternative|thay thế|n|G,I
ambition|tham vọng|n|G,B
amend|sửa đổi|v|G,B
analyze|phân tích|v|A,B,Te
ancestor|tổ tiên|n|G,R
ancient|cổ đại|adj|G,R,A
annual|hàng năm|adj|B
anticipate|dự đoán|v|G
anxiety|lo âu|n|H,I
apparent|rõ ràng|adj|G,I
appeal|kháng cáo, thu hút|v|G,B
appetite|sự thèm ăn|n|H,D
appreciate|đánh giá cao|v|G,D
approach|tiếp cận|v|G,B,A
appropriate|thích hợp|adj|G,I
approve|phê duyệt|v|B
architect|kiến trúc sư|n|G,B
argue|tranh luận|v|G,I
arise|phát sinh|v|G
aspect|khía cạnh|n|G,I,A
assemble|lắp ráp|v|G,Te
assert|khẳng định|v|G,I
assess|đánh giá|v|B,A
asset|tài sản|n|B
assign|giao, phân công|v|B,A
assist|hỗ trợ|v|G,B
associate|liên kết|v|G,B
assume|giả định|v|G,A
assure|đảm bảo|v|G,B
atmosphere|bầu không khí|n|G,A
attach|đính kèm|v|G,Te
attitude|thái độ|n|G,I
authority|quyền lực|n|G,B
automatic|tự động|adj|Te
aware|nhận thức|adj|G,I
awful|tồi tệ|adj|G,D
barrier|rào cản|n|G,I
basis|cơ sở|n|G,A
beneficial|có lợi|adj|G,I,H
benefit|lợi ích|n|G,B,H
betray|phản bội|v|G,D
billion|tỷ|n|G,B
blame|đổ lỗi|v|G,D
blend|pha trộn|v|G
bond|mối liên kết|n|G,D,B
boom|bùng nổ|n|B
border|biên giới|n|G,T
bound|bị ràng buộc|adj|G
brand|thương hiệu|n|B
broadcast|phát sóng|v|G,Te
budget|ngân sách|n|B
burden|gánh nặng|n|G,I
campaign|chiến dịch|n|B,I
candidate|ứng viên|n|B
capacity|năng lực|n|B,I
capture|bắt giữ|v|G
career|sự nghiệp|n|B,I
catalog|danh mục|n|B
category|danh mục|n|G,A
caution|cẩn trọng|n|G
cease|ngừng|v|G,I
ceremony|nghi lễ|n|G,D
chain|chuỗi|n|G,B
chamber|phòng, buồng|n|G
champion|nhà vô địch|n|G,D
channel|kênh|n|G,Te
chapter|chương|n|R
charity|từ thiện|n|G,D
chart|biểu đồ|n|B,A
chemical|hóa chất|n|A,H
chief|trưởng|n|B
chip|con chip|n|Te
chronic|mãn tính|adj|H
circumstance|hoàn cảnh|n|G,I
citizen|công dân|n|G,I
civil|dân sự|adj|G
civilization|nền văn minh|n|A,R
clarify|làm rõ|v|G,I
classic|cổ điển|adj|G,R,M
client|khách hàng|n|B
climate|khí hậu|n|G,I,A
clinic|phòng khám|n|H
code|mã|n|Te
collapse|sụp đổ|v|G
colleague|đồng nghiệp|n|B
colony|thuộc địa|n|A
column|cột|n|G,A
combat|chiến đấu|n|G
combine|kết hợp|v|G,A
comedy|hài kịch|n|M
commander|chỉ huy|n|G
commerce|thương mại|n|B,I
commission|hoa hồng, ủy ban|n|B
commit|cam kết|v|G,B
committee|ủy ban|n|B
commodity|hàng hóa|n|B,I
companion|bạn đồng hành|n|D,T
compensation|bồi thường|n|B
compete|cạnh tranh|v|B,I
complex|phức tạp|adj|G,I,A
component|thành phần|n|Te,A
compose|sáng tác|v|G
comprehensive|toàn diện|adj|I,A
compromise|thỏa hiệp|n|G,B
compute|tính toán|v|Te,A
concentrate|tập trung|v|A,I
concept|khái niệm|n|A,I
conclude|kết luận|v|A,I
concrete|bê tông, cụ thể|n|G
conduct|tiến hành|v|A,B
conference|hội nghị|n|B,A
confess|thú nhận|v|G,D
confidence|sự tự tin|n|I
conflict|xung đột|n|G,I
confront|đối đầu|v|G
congress|quốc hội|n|G,I
conscience|lương tâm|n|G
conscious|có ý thức|adj|G,H
consent|đồng ý|n|G
consequence|hậu quả|n|G,I
conservative|bảo thủ|adj|G,I
considerable|đáng kể|adj|G,I
consist|bao gồm|v|G,A
consistent|nhất quán|adj|G,I
constant|không đổi|adj|G,A
constitute|cấu thành|v|A
construct|xây dựng|v|G
consult|tham vấn|v|B,H
consume|tiêu thụ|v|G,B
contact|liên hệ|n|G,B
contemporary|đương đại|adj|A,G
content|nội dung|n|Te,R
contest|cuộc thi|n|G
context|bối cảnh|n|A,I
contract|hợp đồng|n|B
contradiction|mâu thuẫn|n|A,I
contribute|đóng góp|v|G,I
controversy|tranh cãi|n|I
convention|hội nghị, quy ước|n|B,A
convert|chuyển đổi|v|G,Te
convince|thuyết phục|v|G,I
cooperate|hợp tác|v|B,I
coordinate|phối hợp|v|B
cope|đối phó|v|G,H
core|cốt lõi|n|G,A
corporate|doanh nghiệp|adj|B
correspond|tương ứng|v|A
corrupt|tham nhũng|adj|G,I
council|hội đồng|n|G,B
counter|quầy, phản bác|n|G
craft|thủ công|n|G
crash|va chạm|n|G,T
creative|sáng tạo|adj|G,I
creature|sinh vật|n|G,A
credit|tín dụng|n|B
crew|phi hành đoàn|n|T
crime|tội phạm|n|G,I
crisis|khủng hoảng|n|G,B,I
criteria|tiêu chí|n|A,B
critic|nhà phê bình|n|M,R
critical|quan trọng, phê phán|adj|A,I
crop|mùa vụ|n|G
crucial|quan trọng|adj|G,I,B
crude|thô|adj|G
crystal|pha lê|n|G
cultivate|trồng trọt|v|G,A
culture|văn hóa|n|G,I,A
cure|chữa trị|v|H
currency|tiền tệ|n|B,T
curriculum|chương trình học|n|A
custom|tùy chỉnh, phong tục|n|G,Te
cycle|chu kỳ|n|G,A
database|cơ sở dữ liệu|n|Te
debate|tranh luận|n|I,A
debt|nợ|n|B
decade|thập kỷ|n|G
decent|tử tế|adj|G,D
decline|suy giảm|v|G,B
decorate|trang trí|v|D
decrease|giảm|v|G,B
defeat|đánh bại|v|G
defend|bảo vệ|v|G
define|định nghĩa|v|A,I
definite|chắc chắn|adj|G
degree|bằng cấp, mức độ|n|A
delay|trì hoãn|v|G,B
delegate|đại biểu|n|B
deliberate|cố ý|adj|G
delicate|tinh tế|adj|G
democracy|dân chủ|n|I,A
demonstrate|chứng minh|v|A,I
deny|phủ nhận|v|G
department|phòng ban|n|B
depression|trầm cảm|n|H
deprive|tước đoạt|v|G,I
derive|bắt nguồn|v|A
desert|sa mạc|n|G,T
deserve|xứng đáng|v|G,D
desire|mong muốn|n|G,D
desperate|tuyệt vọng|adj|G
despite|mặc dù|prep|G,I
destination|điểm đến|n|T
detect|phát hiện|v|G,Te
determine|xác định|v|G,A
device|thiết bị|n|Te
devote|cống hiến|v|G,D
dialogue|đối thoại|n|I,M
diet|chế độ ăn|n|H,D
dignity|phẩm giá|n|G,I
dimension|chiều|n|A
diplomat|nhà ngoại giao|n|I
disability|khuyết tật|n|H,I
discipline|kỷ luật|n|A,B
discourse|diễn ngôn|n|A,I
discrimination|phân biệt đối xử|n|I
dismiss|sa thải, bác bỏ|v|B
disorder|rối loạn|n|H
display|hiển thị|v|Te
dispute|tranh chấp|n|B
distinct|riêng biệt|adj|G,A
distinguish|phân biệt|v|A,I
distribute|phân phối|v|B
district|quận|n|G
diverse|đa dạng|adj|I
document|tài liệu|n|B,A
domestic|trong nước|adj|B,I
dominant|thống trị|adj|G,I
donate|quyên góp|v|G,D
dose|liều lượng|n|H
draft|bản nháp|n|G,B
drag|kéo|v|G,Te
drama|kịch|n|M,R
dramatic|kịch tính|adj|M,I
drift|trôi dạt|v|G
drunk|say rượu|adj|G,D
duration|thời lượng|n|G
dust|bụi|n|G
dynamic|năng động|adj|B,Te
eager|háo hức|adj|G,D
ease|dễ dàng|n|G
echo|tiếng vang|n|G
economy|nền kinh tế|n|B,I
edge|cạnh|n|G
edition|phiên bản|n|R
editor|biên tập viên|n|R,Te
elaborate|công phu|adj|G,A
elect|bầu cử|v|G,I
element|yếu tố|n|A
eliminate|loại bỏ|v|G,I
embrace|ôm, đón nhận|v|G,D
emerge|nổi lên|v|G,I
emission|khí thải|n|I,A
emphasize|nhấn mạnh|v|I,A
empire|đế chế|n|A,R
employ|tuyển dụng|v|B
enable|cho phép|v|G,Te
encounter|gặp gỡ|v|G
endure|chịu đựng|v|G
enforce|thực thi|v|G,B
engage|tham gia|v|G,B
enhance|nâng cao|v|G,I,Te
enormous|khổng lồ|adj|G
enterprise|doanh nghiệp|n|B
entertain|giải trí|v|M,D
enthusiasm|sự nhiệt tình|n|G,D
entire|toàn bộ|adj|G
entity|thực thể|n|B,Te
entrance|lối vào|n|G
entrepreneur|doanh nhân|n|B,I
entry|mục, lối vào|n|G
episode|tập phim|n|M
era|kỷ nguyên|n|A
error|lỗi|n|G,Te
essay|bài luận|n|A,I
essential|thiết yếu|adj|G,I
establish|thành lập|v|B,I
estate|bất động sản|n|B
estimate|ước tính|v|B,A
eternal|vĩnh cửu|adj|G
ethnic|dân tộc|adj|I
evaluate|đánh giá|v|A,B
eventually|cuối cùng|adv|G
evolve|tiến hóa|v|A
exaggerate|phóng đại|v|G
exceed|vượt quá|v|B
exception|ngoại lệ|n|G
excessive|quá mức|adj|G,I
exclusive|độc quyền|adj|B
execute|thực hiện|v|B,Te
exhibit|trưng bày|v|G
expand|mở rộng|v|B,I
expense|chi phí|n|B
expertise|chuyên môn|n|B,I
exploit|khai thác|v|G,B
export|xuất khẩu|v|B
expose|phơi bày|v|G
extend|mở rộng|v|G
extensive|rộng lớn|adj|G,I
extent|mức độ|n|G,I
external|bên ngoài|adj|G,Te
extraordinary|phi thường|adj|G,I
extreme|cực đoan|adj|G
facility|cơ sở vật chất|n|B
factor|yếu tố|n|A,B
faculty|khoa|n|A
fascinate|mê hoặc|v|G
fate|số phận|n|G,R
federal|liên bang|adj|G,I
fence|hàng rào|n|G
fiction|tiểu thuyết|n|R,M
fierce|dữ dội|adj|G
finance|tài chính|n|B
firm|công ty, chắc chắn|n|B
flame|ngọn lửa|n|G
flavor|hương vị|n|D
flee|bỏ chạy|v|G
flexible|linh hoạt|adj|B,I
flood|lũ lụt|n|G,I
formal|trang trọng|adj|G,B
formula|công thức|n|A
fortune|vận may|n|G
fossil|hóa thạch|n|A
foundation|nền tảng|n|G,B
fraction|phân số|n|A
fragment|mảnh vỡ|n|G
framework|khuôn khổ|n|B,Te
freeze|đóng băng|v|G
frequency|tần suất|n|A,Te
frustrate|làm thất vọng|v|G,D
fundamental|cơ bản|adj|A,I
fund|quỹ|n|B
furnish|trang bị|v|G
gap|khoảng cách|n|G,I
gather|tập hợp|v|G
gear|bánh răng, thiết bị|n|Te
gender|giới tính|n|I,A
gene|gen|n|A,H
generate|tạo ra|v|Te,A
genetic|di truyền|adj|A,H
genius|thiên tài|n|G
genuine|chính hãng|adj|G,B
globe|quả địa cầu|n|G
govern|cai trị|v|G,I
grace|duyên dáng|n|G
graduate|tốt nghiệp|v|A
grant|tài trợ|n|B,A
grasp|nắm bắt|v|G
grave|ngôi mộ, nghiêm trọng|n|G
guarantee|bảo đảm|v|B
guideline|hướng dẫn|n|B,A
guilt|tội lỗi|n|G
harvest|thu hoạch|n|G
heal|chữa lành|v|H
headline|tiêu đề|n|R
headquarters|trụ sở|n|B
heritage|di sản|n|I,A
highlight|nổi bật|v|G,Te
horizon|đường chân trời|n|G
host|chủ nhà|n|D,T
household|hộ gia đình|n|D,B
humble|khiêm tốn|adj|G,D
hypothesis|giả thuyết|n|A
icon|biểu tượng|n|Te
ideal|lý tưởng|adj|G,I
identity|danh tính|n|G,I
ideology|ý thức hệ|n|I,A
illustrate|minh họa|v|A
image|hình ảnh|n|G,Te
impact|tác động|n|I,A
implement|triển khai|v|B,Te
implication|hàm ý|n|A,I
import|nhập khẩu|v|B
impose|áp đặt|v|G,I
impression|ấn tượng|n|G
incident|sự cố|n|G
incline|nghiêng|v|G
incorporate|kết hợp|v|B
index|chỉ số|n|B,A
indicate|chỉ ra|v|A
individual|cá nhân|n|G,I
inevitable|không thể tránh|adj|G,I
infant|trẻ sơ sinh|n|H
inflation|lạm phát|n|B,I
infrastructure|cơ sở hạ tầng|n|B,I
inhabit|cư trú|v|G
initial|ban đầu|adj|G
initiative|sáng kiến|n|B
innocent|vô tội|adj|G
innovation|đổi mới|n|B,Te,I
input|đầu vào|n|Te
inquiry|điều tra|n|G,B
insert|chèn|v|G,Te
insight|cái nhìn sâu sắc|n|I,A
inspect|kiểm tra|v|B
inspire|truyền cảm hứng|v|G,I
install|cài đặt|v|Te
instance|trường hợp|n|G,A
institute|viện|n|A
institution|tổ chức|n|I,A
integrate|tích hợp|v|Te,I
intellectual|trí thức|adj|A
intense|mãnh liệt|adj|G
interact|tương tác|v|G,Te
interior|nội thất|n|G,D
internal|bên trong|adj|G,B
interpret|diễn giải|v|A,I
interval|khoảng thời gian|n|G,A
intervention|can thiệp|n|H,I
intimate|thân mật|adj|D
investigate|điều tra|v|G,A
investment|đầu tư|n|B
invisible|vô hình|adj|G
isolate|cô lập|v|G,H
journal|tạp chí|n|A,R
jury|bồi thẩm đoàn|n|G
justify|biện minh|v|G,I
keen|nhiệt tình|adj|G
kingdom|vương quốc|n|R
`;

// ============================================================
// LEVEL 3 — Upper-Intermediate (B2) ~800 words
// ============================================================
const L3 = `
abolish|bãi bỏ|v|I,A
accumulate|tích lũy|v|B,A
acknowledge|thừa nhận|v|I,A
acquisition|sự mua lại|n|B
adjacent|liền kề|adj|G
adolescent|thanh thiếu niên|n|H,A
adversity|nghịch cảnh|n|I
affiliate|liên kết|v|B
aggression|sự xâm lược|n|I
allegation|cáo buộc|n|I
allocate|phân bổ|v|B
ambiguous|mơ hồ|adj|I,A
analogy|phép loại suy|n|A,I
anonymous|giấu tên|adj|G,Te
apparatus|bộ máy|n|A
arbitrary|tùy ý|adj|A,I
articulate|diễn đạt rõ|v|I
aspiration|khát vọng|n|I
assassination|ám sát|n|I
autonomy|quyền tự chủ|n|I,A
benchmark|tiêu chuẩn|n|B,Te
bilateral|song phương|adj|I
biodiversity|đa dạng sinh học|n|I,A
bureaucracy|bộ máy quan liêu|n|I,B
catastrophe|thảm họa|n|I
coalition|liên minh|n|I
cognitive|nhận thức|adj|A,H
collaborate|cộng tác|v|B,A
collateral|tài sản thế chấp|n|B
commemorate|tưởng niệm|v|G
compatible|tương thích|adj|Te
compelling|thuyết phục|adj|I,A
compensate|bồi thường|v|B
competent|có năng lực|adj|B,I
complement|bổ sung|v|G,A
comply|tuân thủ|v|B
conceive|hình dung|v|A
concession|nhượng bộ|n|B,I
condense|cô đọng|v|A
confine|hạn chế|v|G
consensus|đồng thuận|n|I,B
consolidate|củng cố|v|B
conspicuous|nổi bật|adj|I
constitute|cấu thành|v|A
constrain|ràng buộc|v|G,A
contemplate|suy ngẫm|v|G,A
contempt|khinh miệt|n|G
contradict|mâu thuẫn|v|A,I
converge|hội tụ|v|A
convey|truyền đạt|v|I,A
cornerstone|nền tảng|n|I
correlate|tương quan|v|A
counterpart|đối tác|n|B,I
credibility|sự tín nhiệm|n|I,B
culminate|đạt đến đỉnh|v|I,A
curriculum|chương trình giảng dạy|n|A
curtail|cắt giảm|v|B,I
cynical|hoài nghi|adj|G
debut|ra mắt|n|M
decisive|quyết đoán|adj|B,I
decree|sắc lệnh|n|I
default|mặc định|n|Te,B
deficiency|sự thiếu hụt|n|H,A
deficit|thâm hụt|n|B,I
degradation|sự suy thoái|n|I,A
deliberation|sự cân nhắc|n|I
demographic|nhân khẩu học|adj|I,A
denote|biểu thị|v|A
depict|mô tả|v|A,M
deploy|triển khai|v|Te,B
depreciate|giảm giá trị|v|B
designate|chỉ định|v|B
detain|giam giữ|v|I
deteriorate|suy giảm|v|H,I
diagnosis|chẩn đoán|n|H
dilemma|tình thế tiến thoái lưỡng nan|n|I
diminish|giảm bớt|v|G,I
disclose|tiết lộ|v|B,I
discrete|rời rạc|adj|A,Te
discrepancy|sự khác biệt|n|A,B
disparity|bất bình đẳng|n|I,A
dispose|xử lý|v|G
disrupt|gây gián đoạn|v|B,Te
disseminate|phổ biến|v|A,I
dissolve|hòa tan|v|A
distort|bóp méo|v|I
divert|chuyển hướng|v|G
doctrine|học thuyết|n|A,I
domain|lĩnh vực|n|Te,A
dominate|thống trị|v|G,I
drought|hạn hán|n|I
dwell|cư trú|v|G
dynamics|động lực học|n|A,B
elicit|gợi ra|v|A,I
eligible|đủ điều kiện|adj|B
embed|nhúng|v|Te,A
emergence|sự xuất hiện|n|I,A
empirical|thực nghiệm|adj|A
empower|trao quyền|v|I,B
encompass|bao gồm|v|A
endeavor|nỗ lực|n|I
endorse|chứng thực|v|B
enlighten|khai sáng|v|A
enrich|làm giàu|v|G,A
entail|đòi hỏi|v|I,A
epidemic|dịch bệnh|n|H,I
equip|trang bị|v|G,B
equity|vốn chủ sở hữu|n|B
equivalent|tương đương|adj|A
erode|xói mòn|v|G,A
escalate|leo thang|v|I
espionage|hoạt động gián điệp|n|I
ethical|đạo đức|adj|I,A,H
evade|trốn tránh|v|G
exert|phát huy|v|I
exile|lưu đày|n|I
expedition|cuộc thám hiểm|n|T,A
explicit|rõ ràng|adj|A,I
exploitation|sự khai thác|n|I,B
extract|trích xuất|v|A,Te
fabricate|bịa đặt|v|G
facade|mặt tiền, vẻ ngoài|n|G
facilitate|tạo điều kiện|v|B,A
famine|nạn đói|n|I
feasible|khả thi|adj|B
federation|liên bang|n|I
fiscal|tài khóa|adj|B
fluctuate|dao động|v|B,A
foreground|tiền cảnh|n|G,Te
forge|rèn, giả mạo|v|G
formulate|xây dựng|v|A,B
forthcoming|sắp tới|adj|G
foster|nuôi dưỡng|v|G,I
fragile|mong manh|adj|G
friction|ma sát|n|A
frontier|biên giới|n|I,A
fulfill|hoàn thành|v|G,B
genocide|diệt chủng|n|I
graft|ghép|v|H,A
grave|nghiêm trọng|adj|G,I
greenhouse|nhà kính|n|I,A
grievance|bất bình|n|I
habitat|môi trường sống|n|I,A
harness|khai thác|v|Te,I
hazard|nguy hiểm|n|H,B
hierarchy|hệ thống phân cấp|n|B,A
humanitarian|nhân đạo|adj|I
ideology|hệ tư tưởng|n|I,A
immense|rộng lớn|adj|G
immune|miễn dịch|adj|H
imperative|bắt buộc|adj|I,A
implicate|liên đới|v|G
implicit|ngầm|adj|A,I
impose|áp đặt|v|I
impulse|xung lực|n|G,H
inadequate|không đầy đủ|adj|I
incentive|động lực|n|B
incidence|tỷ lệ mắc|n|H,A
inclusion|sự bao gồm|n|I
indigenous|bản địa|adj|I,A
induce|gây ra|v|A,H
inequality|bất bình đẳng|n|I
infer|suy luận|v|A,I
inflation|lạm phát|n|B,I
infrastructure|cơ sở hạ tầng|n|B,I
inherent|vốn có|adj|A,I
inhibit|ức chế|v|A,H
inject|tiêm|v|H
innovation|sự đổi mới|n|B,Te
insider|người trong cuộc|n|B
insufficient|không đủ|adj|G,I
integral|không thể thiếu|adj|A,B
integrity|sự chính trực|n|I,B
intensify|tăng cường|v|I
intercept|chặn|v|G,Te
interim|tạm thời|adj|B
intervene|can thiệp|v|I,H
intrinsic|nội tại|adj|A
invade|xâm lược|v|I
invoke|viện dẫn|v|A
irrigation|tưới tiêu|n|A
jurisdiction|thẩm quyền|n|I,B
landmark|mốc|n|T,I
legislation|pháp luật|n|I
legitimate|hợp pháp|adj|I,B
leverage|đòn bẩy|n|B
liability|trách nhiệm pháp lý|n|B
liberate|giải phóng|v|I
literacy|biết chữ|n|A,I
lobby|vận động hành lang|v|I,B
locomotive|đầu máy xe lửa|n|G
longitude|kinh độ|n|A
lucrative|sinh lợi|adj|B
magnitude|cường độ|n|A
mainstream|xu hướng chính|n|I
mandate|ủy quyền|n|I,B
manifest|biểu hiện|v|A
manipulate|thao túng|v|I,Te
manuscript|bản thảo|n|A,R
maritime|hàng hải|adj|B,I
mechanism|cơ chế|n|A,Te
mediate|hòa giải|v|I
medieval|trung cổ|adj|A
metabolism|trao đổi chất|n|H,A
methodology|phương pháp luận|n|A
migrate|di cư|v|I
militant|hiếu chiến|adj|I
millennium|thiên niên kỷ|n|A
minimize|giảm thiểu|v|B,Te
ministry|bộ|n|I
misconception|quan niệm sai lầm|n|A
mobilize|huy động|v|I,B
monopoly|độc quyền|n|B,I
morale|tinh thần|n|B,I
mortgage|thế chấp|n|B
municipal|thuộc thành phố|adj|I
negotiate|đàm phán|v|B,I
neutral|trung lập|adj|I
nonetheless|tuy nhiên|adv|I,A
norm|chuẩn mực|n|I,A
notorious|khét tiếng|adj|I
novice|người mới|n|G
nurture|nuôi dưỡng|v|G,A
obligation|nghĩa vụ|n|B,I
obscure|mơ hồ|adj|A
offset|bù đắp|v|B
optimism|sự lạc quan|n|G,I
orbit|quỹ đạo|n|A
orient|định hướng|v|B
orthodox|chính thống|adj|I,A
outbreak|bùng phát|n|H,I
output|đầu ra|n|Te,B
outrage|phẫn nộ|n|I
outsource|thuê ngoài|v|B
overlap|chồng chéo|v|G,A
override|ghi đè|v|Te
oversight|sự giám sát|n|B
overwhelm|áp đảo|v|G
paradigm|mô hình|n|A
paradox|nghịch lý|n|A,I
parameter|tham số|n|Te,A
partisan|thiên vị|adj|I
patent|bằng sáng chế|n|B,Te
pathology|bệnh lý|n|H,A
patronage|sự bảo trợ|n|I
pedagogy|phương pháp sư phạm|n|A
peninsula|bán đảo|n|A,T
perceive|nhận thức|v|A,I
peripheral|ngoại vi|adj|Te,A
perpetuate|duy trì|v|I,A
perspective|quan điểm|n|I,A
petition|kiến nghị|n|I
phenomenon|hiện tượng|n|A,I
pioneer|tiên phong|n|A,Te
plausible|hợp lý|adj|A,I
pledge|cam kết|v|I,B
polarize|phân cực|v|I
portfolio|hồ sơ|n|B
postpone|hoãn lại|v|G
pragmatic|thực dụng|adj|I
precede|đi trước|v|A
precedent|tiền lệ|n|I,A
precision|sự chính xác|n|A,Te
predator|kẻ săn mồi|n|A
predominant|chiếm ưu thế|adj|I,A
preliminary|sơ bộ|adj|B,A
premium|phí bảo hiểm|n|B
prestige|uy tín|n|B,I
prevalent|phổ biến|adj|I,H
privatize|tư nhân hóa|v|B,I
probe|thăm dò|v|A
proceeds|tiền thu được|n|B
proclaim|tuyên bố|v|I
productivity|năng suất|n|B
profound|sâu sắc|adj|A,I
prohibit|cấm|v|I
projection|dự đoán|n|B,A
prominent|nổi bật|adj|I
propaganda|tuyên truyền|n|I
propel|thúc đẩy|v|G
proportion|tỷ lệ|n|A,B
prosecution|truy tố|n|I
prospective|triển vọng|adj|B
prosperity|sự thịnh vượng|n|I,B
protocol|giao thức|n|Te,B
provoke|khiêu khích|v|I
proximity|sự gần gũi|n|G
pursue|theo đuổi|v|I,B
quota|hạn ngạch|n|B,I
radical|cấp tiến|adj|I
ratify|phê chuẩn|v|I
ratio|tỷ lệ|n|A,B
reconcile|hòa giải|v|I,D
referendum|trưng cầu dân ý|n|I
reform|cải cách|n|I,B
regime|chế độ|n|I
regulate|điều tiết|v|B,I
rehabilitate|phục hồi|v|H
reinforce|tăng cường|v|G,I
reluctant|miễn cưỡng|adj|G
remedy|biện pháp khắc phục|n|H
render|biến thành|v|Te,A
repeal|bãi bỏ|v|I
repercussion|hậu quả|n|I
replicate|sao chép|v|A,Te
reservoir|hồ chứa|n|G,A
residual|còn lại|adj|A
resilient|kiên cường|adj|I,H
resolution|nghị quyết|n|I,B
resonate|cộng hưởng|v|A
restraint|sự kiềm chế|n|I
retention|sự giữ lại|n|B,H
retrieve|truy xuất|v|Te
revelation|sự tiết lộ|n|I
revenue|doanh thu|n|B
revise|sửa đổi|v|A,B
rhetoric|hùng biện|n|I,A
rigid|cứng nhắc|adj|G
rivalry|sự cạnh tranh|n|B
robust|mạnh mẽ|adj|Te,B
sanction|chế tài|n|I
saturate|bão hòa|v|B
scrutiny|sự giám sát|n|I,B
secular|thế tục|adj|I,A
segment|phân khúc|n|B,A
sentiment|tình cảm|n|I
simulate|mô phỏng|v|Te,A
skeptic|người hoài nghi|n|A,I
solidarity|đoàn kết|n|I
solitary|cô độc|adj|G
sophisticated|tinh vi|adj|Te,I
sovereign|chủ quyền|adj|I
speculate|suy đoán|v|B,I
stability|sự ổn định|n|I,B
stagnant|trì trệ|adj|B,I
stance|lập trường|n|I
statute|đạo luật|n|I
stereotype|khuôn mẫu|n|I
stimulate|kích thích|v|H,A
stipulate|quy định|v|B,I
strategic|chiến lược|adj|B,I
subordinate|cấp dưới|n|B
subsidy|trợ cấp|n|B,I
substitute|thay thế|n|G
succession|sự kế thừa|n|I,B
suffice|đủ|v|G
supplement|bổ sung|n|H
suppress|đàn áp|v|I
surge|tăng vọt|n|B
surplus|thặng dư|n|B
surveillance|giám sát|n|Te,I
susceptible|dễ bị|adj|H
suspend|đình chỉ|v|B
sustain|duy trì|v|I,A
syndrome|hội chứng|n|H
synthesis|tổng hợp|n|A
tariff|thuế quan|n|B,I
tenure|nhiệm kỳ|n|B,A
terminate|chấm dứt|v|B
terrain|địa hình|n|T,A
testimony|lời khai|n|I
threshold|ngưỡng|n|A,Te
tolerate|chấp nhận, chịu đựng|v|I
trajectory|quỹ đạo|n|A
transaction|giao dịch|n|B,Te
transcend|vượt qua|v|A,I
transition|chuyển đổi|n|B,I
transparent|minh bạch|adj|B,I
treaty|hiệp ước|n|I
tribunal|tòa án|n|I
trigger|kích hoạt|v|Te,H
trivial|tầm thường|adj|G
turbulence|nhiễu loạn|n|A,T
undermine|phá hoại|v|I
unprecedented|chưa từng có|adj|I
unveil|tiết lộ|v|I,B
uphold|duy trì|v|I
utilize|sử dụng|v|A,B
validate|xác nhận|v|Te,A
venture|liên doanh|n|B
verdict|phán quyết|n|I
verify|xác minh|v|Te,A
viable|khả thi|adj|B,I
virtue|đức hạnh|n|I,A
volatile|dễ bay hơi, biến động|adj|B,A
vulnerable|dễ bị tổn thương|adj|I,H
warrant|lệnh, bảo đảm|n|I,B
wholesale|bán buôn|n|B
wield|sử dụng|v|I,A
yield|năng suất, nhượng bộ|n|B,A
`;

// ============================================================
// Parse, validate, and output
// ============================================================
function parseLevel(data, level) {
  return data
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((l) => parse(l, level));
}

const all = [
  ...parseLevel(L0, 0),
  ...parseLevel(L1, 1),
  ...parseLevel(L2, 2),
  ...parseLevel(L3, 3),
];

// Deduplicate
const seen = new Set();
const unique = [];
for (const w of all) {
  const key = w.word.toLowerCase();
  if (!seen.has(key)) {
    seen.add(key);
    unique.push(w);
  }
}

// Distribution
const dist = [0, 0, 0, 0];
for (const w of unique) dist[w.difficultyLevel]++;
console.log(
  `Level distribution: Beginner=${dist[0]} Pre-Int=${dist[1]} Int=${dist[2]} Upper-Int=${dist[3]}`
);
console.log(`Total unique words: ${unique.length}`);

// Write output
const outDir = path.resolve(__dirname, '..', 'assets', 'dictionary');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'base-5000.json');
fs.writeFileSync(outPath, JSON.stringify(unique, null, 2), 'utf-8');

const mb = (fs.statSync(outPath).size / 1048576).toFixed(2);
console.log(`Output: ${unique.length} words | ${mb}MB | ${outPath}`);
