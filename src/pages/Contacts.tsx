import { mockContacts } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Users2 } from "lucide-react";
import { useState } from "react";

export default function ContactsPage() {
  const [search, setSearch] = useState("");

  const filtered = mockContacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search contacts..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Contact</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((contact) => (
          <Card key={contact.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                  <Users2 className="h-5 w-5 text-accent-foreground" />
                </div>
                <Badge variant="secondary">{contact.type}</Badge>
              </div>
              <h3 className="font-semibold">{contact.name}</h3>
              <p className="text-sm text-muted-foreground">{contact.country}</p>
              {contact.email && <p className="text-sm text-muted-foreground truncate">{contact.email}</p>}
              {contact.vatNumber && <p className="text-xs text-muted-foreground mt-1">VAT: {contact.vatNumber}</p>}
              <div className="mt-3 pt-3 border-t flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{contact.documentsCount} documents</span>
                {contact.defaultCategory && (
                  <Badge variant="outline" className="text-xs">{contact.defaultCategory}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
